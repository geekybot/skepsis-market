import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LandingPage from "@/components/landingPage";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>Skepsis - Decentralized Continuous Outcome Prediction Markets</title>
        <meta name="description" content="A decentralized prediction market platform on Sui blockchain that enables trading on continuous numerical outcome spaces rather than just binary outcomes." />
        <link rel="icon" href="/images/skepsis-transparent.png" />
      </Head>
      <main
        className={cn(
          "relative w-full min-h-svh h-full max-w-360 flex flex-col items-center mx-auto pb-28 pt-20 px-4 z-10",
          inter.className
        )}
      >
        <Header />
        <LandingPage />
        <Footer />
      </main>
    </>
  );
}
