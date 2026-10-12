import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_TOKEN } from "@/lib/auth";
import { type FavoriteProduct } from "@/types/favorite";
import FavoriteProductActions from "@/app/account/favorites/FavoriteProductActions";

type FavoritesResponse = {
  favorites: FavoriteProduct[];
};

const getFavorites = async (): Promise<FavoriteProduct[]> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN)?.value;
  if (!token) {
    redirect("/login?redirect=%2Faccount%2Ffavorites");
  }

  const response = await fetch(`${process.env.BASE_URL}/api/favorites`, {
    cache: "no-store",
    headers: { Cookie: `${AUTH_TOKEN}=${token}` },
  });

  if (response.status === 401) {
    redirect("/login?redirect=%2Faccount%2Ffavorites");
  }
  if (!response.ok) {
    throw new Error("お気に入り一覧を取得できませんでした。");
  }

  const data = (await response.json()) as FavoritesResponse;
  return data.favorites;
};

const FavoritesPage = async () => {
  const favorites = await getFavorites();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Link href="/account" className="text-indigo-600 hover:underline">
        ← マイページへ戻る
      </Link>
      <h1 className="mb-8 mt-5 text-center">お気に入り商品一覧</h1>

      {favorites.length === 0 ? (
        <p className="py-12 text-center text-gray-600">お気に入り商品はまだありません。</p>
      ) : (
        <ul className="space-y-4">
          {favorites.map((favorite) => {
            const imageUrl = favorite.image_url
              ? `/uploads/${favorite.image_url}`
              : "/images/no-image.jpg";

            return (
              <li
                key={favorite.id}
                className="flex flex-col gap-4 rounded-md border border-gray-200 p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <Link href={`/products/${favorite.product_id}`} className="shrink-0">
                  <Image
                    src={imageUrl}
                    alt={favorite.name}
                    width={120}
                    height={120}
                    className="h-[120px] w-[120px] rounded object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${favorite.product_id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-700 hover:underline"
                  >
                    {favorite.name}
                  </Link>
                  <p className="mt-2 text-lg font-semibold text-indigo-700">
                    ¥{Number(favorite.price).toLocaleString()}
                  </p>
                </div>
                <FavoriteProductActions product={favorite} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
};

export default FavoritesPage;
