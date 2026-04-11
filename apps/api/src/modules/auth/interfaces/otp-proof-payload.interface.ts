export type OtpProofPayload =
  | {
      typ: 'otp_proof';
      purpose: 'register';
      channel: 'email';
      email: string;
      phoneNumber: null;
    }
  | {
      typ: 'otp_proof';
      purpose: 'register';
      channel: 'phone';
      email: null;
      phoneNumber: string;
    }
  | {
      typ: 'otp_proof';
      purpose: 'forgot_password';
      userId: string;
      email: string | null;
      phoneNumber: string | null;
    };
