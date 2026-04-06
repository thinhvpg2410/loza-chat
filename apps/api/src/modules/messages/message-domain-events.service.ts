import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { MessageView, ReactionSummaryView } from './types/message-view';

export type MessageDomainEvent =
  | {
      type: 'message.created';
      conversationId: string;
      message: MessageView;
    }
  | {
      type: 'message.reaction_updated';
      conversationId: string;
      messageId: string;
      summary: ReactionSummaryView;
    };

@Injectable()
export class MessageDomainEventsService {
  private readonly subject = new Subject<MessageDomainEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: MessageDomainEvent): void {
    this.subject.next(event);
  }
}
