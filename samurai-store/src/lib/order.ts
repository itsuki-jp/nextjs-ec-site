export const SHIPPING_COST = 500;

export type OrderItem = {
  id: number;
  title: string;
  price: number;
  quantity: number;
};

export type OrderStatus =
  | "未処理"
  | "処理中"
  | "出荷済み"
  | "完了"
  | "キャンセル"
  | "返金済み";

export type PaymentStatus =
  | "未決済"
  | "決済処理中"
  | "決済成功"
  | "決済失敗"
  | "返金処理中"
  | "返金済み";
