import { t, log } from './common';
import { Request } from 'express';

/**
 * The Context that is passed to all GraphQL resolvers.
 */
export class Context implements t.IContext {
  /**
   * [Lifecycle]
   */
  constructor(args: { req: Request }) {
    this.req = args.req;
  }

  /**
   * [Fields]
   */
  private req: Request;

  /**
   * [Methods]
   */
  public async getUser() {
    return { email: 'mary@example.com' };
  }

  public async authorize(policy: t.AuthPolicy) {
    const token = this.req.headers.authorization;
    if (!token) {
      log.info(`✋  No authorization token found.\n`);
    }

    const result: t.IAuthResult = {
      isAllowed: false,
      matches: [],
      user: undefined,
    };
    return result;
  }
}
