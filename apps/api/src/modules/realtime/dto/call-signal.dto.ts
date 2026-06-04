import { IsObject, IsString, IsUUID } from 'class-validator';

export class CallOfferDto {
  @IsUUID()
  callId!: string;

  @IsString()
  to!: string;

  @IsObject()
  sdp!: Record<string, unknown>;
}

export class CallAnswerSdpDto {
  @IsUUID()
  callId!: string;

  @IsString()
  to!: string;

  @IsObject()
  sdp!: Record<string, unknown>;
}

export class CallIceCandidateDto {
  @IsUUID()
  callId!: string;

  @IsString()
  to!: string;

  @IsObject()
  candidate!: Record<string, unknown>;
}

export class CallEndDto {
  @IsUUID()
  callId!: string;
}
