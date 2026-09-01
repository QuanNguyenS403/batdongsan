import Link from 'next/link';
import { Listing, formatPrice } from '@/lib/api';

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0]?.imageUrl;

  return (
    <Link
      href={`/tin/${listing.slug}`}
      className="block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full bg-gray-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 font-medium text-gray-900">{listing.title}</p>
        <p className="text-sm text-gray-500">{listing.addressDetail ?? listing.location.name}</p>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{listing.areaM2} m²</span>
          {listing.bedrooms != null && <span>{listing.bedrooms} PN</span>}
          {listing.bathrooms != null && <span>{listing.bathrooms} WC</span>}
        </div>
        <p className="text-lg font-semibold text-brand-dark">{formatPrice(listing.price)}</p>
      </div>
    </Link>
  );
}
