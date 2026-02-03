import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full pt-16 md:pt-0">

      {/* HERO SECTION */}
      <section className="relative w-full flex justify-center px-4 py-6">
        <div className="w-full max-w-5xl">
          <Image
            src="/images/page-hero.png"
            alt="Hero"
            width={1920}
            height={1080}
            priority
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/20">
          <h1 className="uppercase tracking-tight sm:tracking-normal leading-tight sm:leading-snug
             text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold">
            Welcome to Neuro<span className="text-blue-500">Fit</span>
          </h1>

          <p className="font-normal text-white text-base sm:text-lg md:text-xl max-w-xl ">
            AI-powered fashion. Try on styles instantly with generative models.
          </p>

          <Link
            href="/shop"
            className="bg-black px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4
             text-sm sm:text-base md:text-lg rounded-lg transition transform active:scale-95 active:bg-gray-800"
          >
            Try Now
          </Link>
        </div>
      </section>

      {/* WINDOWS SECTION */}
      <section className="w-full max-w-6xl px-4 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* SHOP */}
        <Link href="/shop" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition active:scale-95 active:shadow-inner">
            <Image
              src="/images/shop-hero.png"
              alt="Shop"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Shop
              </div>
            </div>
          </div>
        </Link>

        {/* CLOSET */}
        <Link href="/closet" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition active:scale-95 active:shadow-inner">
            <Image
              src="/images/closet-hero.png"
              alt="Closet"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Closet
              </div>
            </div>

          </div>
        </Link>

        {/* LOGIN / SIGNUP */}
        <Link href="/login" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition active:scale-95 active:shadow-inner">
            <Image
              src="/images/blank-avatar.png"
              alt="Login"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Sign In
              </div>
            </div>

          </div>
        </Link>

        {/* ABOUT US */}
        <Link href="/about" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition active:scale-95 active:shadow-inner">
            <Image
              src="/images/about-hero.png"
              alt="About"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                About Us
              </div>
            </div>
          </div>
        </Link>

      </section>

    </main>
  );
}
