import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { InvoiceInput } from "@ledgent/contracts";
import { createHash, randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InvoicesService {
  private readonly s3: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.s3 = new S3Client({ region: this.config.get<string>("AWS_REGION", "us-east-1") });
  }

  async list(organizationId: string, query: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 25);
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search, mode: "insensitive" as const } },
              { vendor: { name: { contains: query.search, mode: "insensitive" as const } } },
              { purchaseOrder: { poNumber: { contains: query.search, mode: "insensitive" as const } } }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, riskLevel: true, paymentTerms: true } },
          purchaseOrder: { select: { id: true, poNumber: true, status: true, totalAmount: true } },
          _count: { select: { approvalTasks: true, documents: true, comments: true } }
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.invoice.count({ where })
    ]);

    return { items, total, page, pageSize };
  }

  get(organizationId: string, id: string) {
    return this.prisma.invoice.findFirstOrThrow({
      where: { id, organizationId, deletedAt: null },
      include: {
        vendor: true,
        purchaseOrder: { include: { lineItems: true, goodsReceipts: { include: { lineItems: true } } } },
        lineItems: true,
        documents: true,
        approvalTasks: { include: { assignedTo: true, completedBy: true, workflowStep: true } },
        comments: { orderBy: { createdAt: "desc" } },
        aiLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        journalEntries: true
      }
    });
  }

  async create(organizationId: string, userId: string, input: InvoiceInput) {
    const duplicate = await this.prisma.invoice.findFirst({
      where: {
        organizationId,
        vendorId: input.vendorId,
        invoiceNumber: input.invoiceNumber,
        deletedAt: null
      }
    });

    if (duplicate) {
      throw new BadRequestException("Duplicate invoice detected for this vendor and invoice number");
    }

    const { lineItems, ...invoice } = input;

    const created = await this.prisma.invoice.create({
      data: {
        ...invoice,
        organizationId,
        status: "AP_REVIEW",
        createdById: userId,
        updatedById: userId,
        lineItems: { create: lineItems }
      },
      include: { vendor: true, purchaseOrder: true, lineItems: true }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "INVOICE_CREATED",
        entityType: "Invoice",
        entityId: created.id,
        after: { invoiceNumber: created.invoiceNumber, totalAmount: created.totalAmount, status: created.status }
      }
    });

    return created;
  }

  async attachDocument(
    organizationId: string,
    userId: string,
    invoiceId: string,
    file: Express.Multer.File | undefined
  ) {
    if (!file) {
      throw new BadRequestException("Document upload is required");
    }

    const allowedMimeTypes = new Set(["application/pdf", "image/png", "image/jpeg"]);
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException("Only PDF, PNG, and JPEG invoice documents are supported");
    }

    const bucket = this.config.get<string>("S3_BUCKET");
    if (!bucket) {
      throw new ServiceUnavailableException("Document storage is not configured");
    }

    await this.prisma.invoice.findFirstOrThrow({ where: { id: invoiceId, organizationId, deletedAt: null } });

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `organizations/${organizationId}/invoices/${invoiceId}/${randomUUID()}-${safeName}`;
    const checksum = createHash("sha256").update(file.buffer).digest("hex");

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: { checksum }
      })
    );

    const document = await this.prisma.document.create({
      data: {
        organizationId,
        invoiceId,
        type: "INVOICE",
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        checksum,
        createdById: userId
      }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "INVOICE_DOCUMENT_ATTACHED",
        entityType: "Document",
        entityId: document.id,
        after: { invoiceId, fileName: document.fileName, mimeType: document.mimeType, sizeBytes: document.sizeBytes }
      }
    });

    return document;
  }

  async transition(organizationId: string, id: string, userId: string, status: string, reason?: string) {
    const invoice = await this.prisma.invoice.findFirstOrThrow({ where: { id, organizationId, deletedAt: null } });

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: status as never,
        updatedById: userId,
        ...(reason ? { exceptionSummary: reason } : {})
      }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "INVOICE_STATUS_CHANGED",
        entityType: "Invoice",
        entityId: id,
        before: { status: invoice.status },
        after: { status, reason }
      }
    });

    return updated;
  }

  async addComment(organizationId: string, invoiceId: string, userId: string, body: string) {
    await this.prisma.invoice.findFirstOrThrow({ where: { id: invoiceId, organizationId, deletedAt: null } });

    return this.prisma.comment.create({
      data: {
        invoiceId,
        authorId: userId,
        body
      }
    });
  }
}
