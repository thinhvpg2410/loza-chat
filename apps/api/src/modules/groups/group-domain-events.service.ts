import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type GroupDomainEvent =
  | {
      type: 'group.created';
      conversationId: string;
      title: string;
    }
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
      type: 'group.dissolved';
      conversationId: string;
    }
  | {
      type: 'group.join_request_created';
      conversationId: string;
      userId: string;
    }
  | {
      type: 'group.join_request_decided';
      conversationId: string;
      userId: string;
      approved: boolean;
    }
  | {
      type: 'group.member_role_updated';
      conversationId: string;
      userId: string;
      role: 'owner' | 'admin' | 'member';
    };

@Injectable()
export class GroupDomainEventsService {
  private readonly subject = new Subject<GroupDomainEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: GroupDomainEvent): void {
    this.subject.next(event);
  }
}
