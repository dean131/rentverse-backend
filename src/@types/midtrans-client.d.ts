declare module "midtrans-client" {
  export class CoreApi {
    constructor(config: any);
    transaction: {
      notification(body: any): Promise<any>;
    };
  }
  export class Snap {
    constructor(config: any);
    createTransaction(
      parameter: any
    ): Promise<{ token: string; redirect_url: string }>;
  }
}
