import { IsBoolean, IsUUID } from 'class-validator';

export class CallAnswerDto {
  @IsUUID()
  callId!: string;

  @IsBoolean()
  accepted!: boolean;
}
