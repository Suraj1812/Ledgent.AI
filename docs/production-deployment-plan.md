# Production Deployment Plan

## AWS Reference Architecture

- Route 53 and ACM for DNS and TLS.
- CloudFront in front of the web app.
- ECS Fargate services for API and workers.
- Application Load Balancer for API traffic.
- RDS PostgreSQL with automated backups and point-in-time recovery.
- ElastiCache Redis for BullMQ and rate-limit state.
- S3 buckets for invoice documents and exports.
- Secrets Manager for JWT, database, OpenAI, AWS, and ERP credentials.
- CloudWatch logs, metrics, alarms, and dashboards.

## Deployment Steps

1. Build and push API and web images to ECR.
2. Run Prisma migrations as a one-off ECS task.
3. Deploy API service with health check at `/api/health`.
4. Deploy worker service with queue concurrency tuned by tenant volume.
5. Deploy web assets behind CloudFront or the included Nginx container.
6. Configure autoscaling on CPU, memory, queue depth, and request latency.
7. Enable alarms for failed jobs, approval SLA breaches, ERP posting errors, and auth anomalies.

## Release Strategy

- Use GitHub Actions for typecheck, build, test, and image publishing.
- Deploy migrations before application rollout.
- Use blue-green deployments for API services.
- Keep ERP connectors behind feature flags until tenant credentials pass validation.
- Store generated reports in tenant-scoped S3 prefixes with lifecycle policies.
