import { type Context } from "@/lib/context";
import { AuthService } from "./auth.service";
import { InvitationService } from "./invitation.service";
import { UserService } from "./user.service";
import { RelationshipService } from "./relationship.service";
import { PostService } from "./post.service";
import { AttachmentService } from "./attachment.service";

/**
 * Service factory - creates service instances with shared context
 * Lazy instantiation ensures services are only created when needed
 */
export class Services {
  private authService?: AuthService;
  private invitationService?: InvitationService;
  private userService?: UserService;
  private relationshipService?: RelationshipService;
  private postService?: PostService;
  private attachmentService?: AttachmentService;

  constructor(private readonly ctx: Context) {}

  get auth(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.ctx);
    }
    return this.authService;
  }

  get invitation(): InvitationService {
    if (!this.invitationService) {
      this.invitationService = new InvitationService(this.ctx);
    }
    return this.invitationService;
  }

  get user(): UserService {
    if (!this.userService) {
      this.userService = new UserService(this.ctx);
    }
    return this.userService;
  }

  get relationship(): RelationshipService {
    if (!this.relationshipService) {
      this.relationshipService = new RelationshipService(this.ctx);
    }
    return this.relationshipService;
  }

  get post(): PostService {
    if (!this.postService) {
      this.postService = new PostService(this.ctx);
    }
    return this.postService;
  }

  get attachment(): AttachmentService {
    if (!this.attachmentService) {
      this.attachmentService = new AttachmentService(this.ctx);
    }
    return this.attachmentService;
  }
}

/**
 * Helper to create services from context
 * Usage in routes: const services = createServices(ctx);
 */
export function createServices(ctx: Context): Services {
  return new Services(ctx);
}
