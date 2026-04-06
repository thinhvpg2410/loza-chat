import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type GroupDomainEvent =
  | {
      type: 'group.updated';
      conversationId: string;
      payload: { title?: string | null; avatarUrl?: string | null };
    }
  | {
      type: 'group.member_added';
      conversationId: string;
      userIds: string[];
    }
  | {
      type: 'group.member_removed';
      conversationId: string;
      userId: string;
    }
  | {
      type: 'group.system_message';
      conversationId: string;
      messageId: string;
    };

@Injectable()
export class GroupDomainEventsService {
  private readonly subject = new Subject<GroupDomainEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: GroupDomainEvent): void {
    this.subject.next(event);
  }
}
