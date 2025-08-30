import Footer from "./(root)/_components/footer";
import Heading from "./(root)/_components/heading";
import Hero from "./(root)/_components/hero";

export default function HomePage() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex flex-col items-center justify-center md:justify-start text-center gap-y-8 flex-1 px-6 pb-10">
        <Heading />
        <Hero />
      </div>
      <Footer />
    </div>
  );
}
