import { IsIn, IsString, IsUUID } from 'class-validator';

export class CallInitiateDto {
  @IsUUID()
  callId!: string;

  @IsString()
  conversationId!: string;

  @IsIn(['voice', 'video'])
  callType!: 'voice' | 'video';
}
