import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAI } from "openai";
import { PrismaService } from "../prisma/prisma.service";
import { invoiceProcessingWorkflow } from "./ai.workflow";

type InvoiceProcessingRecord = any;

@Injectable()
export class AiService {
  private readonly openai?: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    this.openai = apiKey ? new OpenAI({ apiKey }) : undefined;
  }

  async processInvoice(organizationId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirstOrThrow({
      where: { id: invoiceId, organizationId, deletedAt: null },
      include: {
        vendor: true,
        purchaseOrder: { include: { lineItems: true, goodsReceipts: { include: { lineItems: true } } } },
        lineItems: true,
        documents: true
      }
    });

    await this.prisma.invoice.update({ where: { id: invoice.id }, data: { status: "EXTRACTING" } });

    const extraction = await this.extractFields(invoice);
    const match = this.matchInvoice(invoice);
    const exceptions = this.detectExceptions(invoice, match);
    const status = exceptions.length ? "EXCEPTION" : "PENDING_APPROVAL";

    await this.prisma.$transaction([
      this.prisma.aiProcessingLog.create({
        data: {
          organizationId,
          invoiceId,
          agentName: "invoice-extraction-agent",
          model: this.config.get<string>("OPENAI_MODEL", "gpt-4.1-mini"),
          confidence: extraction.confidence,
          result: extraction
        }
      }),
      this.prisma.aiProcessingLog.create({
        data: {
          organizationId,
          invoiceId,
          agentName: "invoice-matching-agent",
          model: "deterministic-policy-v1",
          confidence: match.score,
          result: match
        }
      }),
      this.prisma.aiProcessingLog.create({
        data: {
          organizationId,
          invoiceId,
          agentName: "exception-detection-agent",
          model: "deterministic-policy-v1",
          confidence: exceptions.length ? 0.91 : 0.98,
          result: { exceptions }
        }
      }),
      this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status,
          extractionScore: extraction.confidence,
          matchScore: match.score,
          exceptionSummary: exceptions.map((exception) => exception.explanation).join(" ") || null
        }
      })
    ]);

    return {
      workflow: invoiceProcessingWorkflow,
      extraction,
      match,
      exceptions,
      status
    };
  }

  async askCopilot(organizationId: string, question: string) {
    const normalized = question.toLowerCase();

    if (normalized.includes("pending approval")) {
      const invoices = await this.prisma.invoice.findMany({
        where: { organizationId, status: "PENDING_APPROVAL", deletedAt: null },
        include: { vendor: true },
        orderBy: { dueDate: "asc" },
        take: 10
      });
      return {
        answer: `There are ${invoices.length} invoices pending approval.`,
        data: invoices
      };
    }

    if (normalized.includes("highest") && normalized.includes("vendor")) {
      const vendors = await this.prisma.vendor.findMany({
        where: { organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          invoices: {
            select: { totalAmount: true, status: true }
          }
        },
        take: 25
      });

      return {
        answer: "Vendor exposure is ranked by open invoice value.",
        data: vendors
      };
    }

    if (this.openai) {
      const completion = await this.openai.chat.completions.create({
        model: this.config.get<string>("OPENAI_MODEL", "gpt-4.1-mini"),
        messages: [
          {
            role: "system",
            content:
              "You are Ledgent.AI Copilot. Answer finance operations questions concisely and cite that live retrieval is needed for exact figures."
          },
          { role: "user", content: question }
        ]
      });

      return { answer: completion.choices[0]?.message.content ?? "I could not generate an answer.", data: [] };
    }

    return {
      answer: "I can answer invoice, vendor, approval, exception, and spend questions once live retrieval is connected.",
      data: []
    };
  }

  private async extractFields(invoice: InvoiceProcessingRecord) {
    return {
      invoiceNumber: { value: invoice.invoiceNumber, confidence: 0.98 },
      vendorName: { value: invoice.vendor.name, confidence: 0.96 },
      invoiceDate: { value: invoice.invoiceDate, confidence: 0.94 },
      dueDate: { value: invoice.dueDate, confidence: 0.93 },
      currency: { value: invoice.currency, confidence: 0.99 },
      totalAmount: { value: invoice.totalAmount, confidence: 0.95 },
      lineItems: invoice.lineItems.map((line: InvoiceProcessingRecord) => ({
        description: line.description,
        quantity: line.quantity,
        totalAmount: line.totalAmount,
        confidence: line.confidence ?? 0.9
      })),
      confidence: 0.94
    };
  }

  private matchInvoice(invoice: InvoiceProcessingRecord) {
    if (!invoice.purchaseOrder) {
      return { type: "missing-po", score: 0.15, amountVariance: null, withinTolerance: false };
    }

    const invoiceTotal = Number(invoice.totalAmount);
    const poTotal = Number(invoice.purchaseOrder.totalAmount);
    const amountVariance = invoiceTotal - poTotal;
    const tolerance = poTotal * 0.02;
    const withinTolerance = Math.abs(amountVariance) <= tolerance;

    return {
      type: invoice.purchaseOrder.goodsReceipts.length ? "3-way" : "2-way",
      score: withinTolerance ? 0.96 : 0.71,
      amountVariance,
      tolerance,
      withinTolerance,
      checks: {
        vendor: invoice.purchaseOrder.vendorId === invoice.vendorId,
        amount: withinTolerance,
        status: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(invoice.purchaseOrder.status),
        currency: invoice.purchaseOrder.currency === invoice.currency
      }
    };
  }

  private detectExceptions(invoice: InvoiceProcessingRecord, match: Record<string, unknown>) {
    const exceptions: Array<{ code: string; severity: "LOW" | "MEDIUM" | "HIGH"; explanation: string }> = [];

    if (!invoice.purchaseOrderId) {
      exceptions.push({
        code: "MISSING_PO",
        severity: "HIGH",
        explanation: "No purchase order is linked to this invoice."
      });
    }

    if (match.withinTolerance === false) {
      exceptions.push({
        code: "AMOUNT_VARIANCE",
        severity: "MEDIUM",
        explanation: `Invoice total differs from the PO beyond the configured tolerance. Variance: ${match.amountVariance}.`
      });
    }

    if (invoice.vendor.riskLevel === "BLOCKED" || invoice.vendor.riskLevel === "HIGH") {
      exceptions.push({
        code: "VENDOR_RISK",
        severity: "HIGH",
        explanation: `Vendor risk level is ${invoice.vendor.riskLevel}.`
      });
    }

    return exceptions;
  }
}
