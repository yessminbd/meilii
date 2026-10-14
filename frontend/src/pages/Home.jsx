import BannerSlider from "../components/BannerSlider";
import BannerCta from "../components/BannerCta";
import Features from "../components/Features";
import Popular from "../components/Popular";
import Partners from "../components/Partners";

export default function Home() {
  return (
    <div>
      <BannerSlider />
      <BannerCta />
      <Popular />
      <Partners />
      <Features />
    </div>
  );
}
