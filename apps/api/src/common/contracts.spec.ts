import {
  integrationSchema,
  invoiceTransitionSchema,
  loginSchema,
  organizationSettingsSchema,
  refreshTokenSchema,
  userSchema
} from "../../../../packages/contracts/src/index";

describe("shared write contracts", () => {
  it("accepts a complete settings payload", () => {
    expect(
      organizationSettingsSchema.parse({
        matchingTolerancePercent: 2,
        quantityTolerancePercent: 1,
        currencyPolicy: "review",
        duplicateDetectionEnabled: true,
        requirePoAboveThreshold: true,
        mfaRequiredForFinanceAdmins: true,
        notifyApproversBeforeSlaBreach: true,
        archiveOriginalDocuments: false,
        sessionTimeoutMinutes: 30,
        defaultErp: "NETSUITE"
      })
    ).toMatchObject({ defaultErp: "NETSUITE", sessionTimeoutMinutes: 30 });
  });

  it("rejects unsafe user passwords and unknown ERP systems", () => {
    expect(
      userSchema.safeParse({
        email: "finance@example.com",
        firstName: "Finance",
        lastName: "User",
        role: "FINANCE_MANAGER",
        permissions: [],
        password: "short"
      }).success
    ).toBe(false);
    expect(integrationSchema.safeParse({ system: "CUSTOM_LEDGER", syncSettings: {} }).success).toBe(false);
  });

  it("restricts invoice transitions and refresh payloads", () => {
    expect(invoiceTransitionSchema.safeParse({ status: "APPROVED", reason: "Reviewed" }).success).toBe(true);
    expect(invoiceTransitionSchema.safeParse({ status: "REMOVED" }).success).toBe(false);
    expect(refreshTokenSchema.safeParse({ refreshToken: "too-short" }).success).toBe(false);
  });

  it("treats an empty optional MFA code as absent", () => {
    expect(loginSchema.parse({ email: "finance@example.com", password: "a-strong-password", mfaCode: "" })).toEqual({
      email: "finance@example.com",
      password: "a-strong-password",
      mfaCode: undefined
    });
  });
});
