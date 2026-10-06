"use client";

interface SortProps {
  sort: string;
  perPage: number;
  keyword: string;
}

const Sort = ({ sort, perPage, keyword }: SortProps) => {
  return (
    <form
      action="/products"
      method="GET"
      className="flex flex-col gap-4 md:flex-row"
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="perPage" value={perPage} />
      <input type="hidden" name="keyword" value={keyword} />
      <label className="sr-only" htmlFor="product-sort">
        商品の並べ替え
      </label>
      <select
        id="product-sort"
        name="sort"
        value={sort}
        className="w-full rounded border border-gray-300 px-4 py-2 md:w-48"
        onChange={(event) => event.currentTarget.form?.submit()}
      >
        <option value="new">新着順</option>
        <option value="priceAsc">価格が安い順</option>
      </select>
    </form>
  );
};

export default Sort;
