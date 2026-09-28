// Maps User.shipperOnboardingStep (backend) to the matching onboarding screen route
// name, used both to resume onboarding on relaunch and to route right after signup/login.
export const SHIPPER_STEP_TO_ROUTE = {
  your_info: "YourInformation",
  account_type: "AccountType",
  business_info: "BusinessInformation",
  primary_location: "PrimaryLocation",
  billing_info: "BillingInformation",
  documents: "RequiredDocuments",
  terms: "TermsAgreements",
  signature: "ESignature",
  submitted: "UnderReview",
  complete: "Home",
};

export const routeForShipperStep = (step) => SHIPPER_STEP_TO_ROUTE[step] || "YourInformation";
