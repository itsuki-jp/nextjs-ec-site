export type ReviewData = {
  id: number;
  product_id: number;
  user_id: number;
  score: number;
  content: string;
  created_at: string;
  user_name: string;
};

export type ReviewsResponse = {
  reviews: ReviewData[];
  review_avg: number;
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
};
