import { Button } from "@nextui-org/button";
import { GithubIcon, HeartFilledIcon } from "@/components/icons";

import { Link } from "@nextui-org/link";
import { siteConfig } from "@/config/site";

export default function AboutPage() {
  return (
    <div>
      <p className="font-bold mb-2">About</p>
      <p>
        The GHS Label Generator was created out of necessity. Despite the
        importance of GHS labels for safety and compliance, free, user-friendly
        solution existed, so I decided to build one. This app is entirely free
        and accessible to users around the globe because safety should never
        come with a price tag. It's my contribution to a safer, more compliant
        world.
      </p>
      <p className="mt-2">
        With integrated PubChem CID lookup, the tool allows you to quickly fetch
        and auto-fill chemical data, making the process faster and more
        accurate. Whether you're a professional or just need a simple solution,
        this app is here to make hazard labeling easy and reliable. Thank you
        for using this tool, and feel free to share it with your community!
      </p>
      <Button
        isExternal
        as={Link}
        className="text-sm font-normal mt-4 mr-2 text-default-600 bg-default-100"
        href={siteConfig.links.sponsor}
        startContent={<HeartFilledIcon className="text-danger" />}
        variant="flat"
      >
        Sponsor
      </Button>
      <Link isExternal aria-label="Github" href={siteConfig.links.github}>
        <GithubIcon className="text-default-500" />
      </Link>
      <div className="flex justify-center py-3 mt-4">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://nextui.org"
          title="nextui.org homepage"
        >
          <span className="text-default-600 text-xs">Powered by</span>
          <p className="text-primary text-xs">NextUI</p>
        </Link>

        <Link
          isExternal
          className="flex ml-2 items-center gap-1 text-current"
          href="https://pubchem.ncbi.nlm.nih.gov/"
          title="nextui.org homepage"
        >
          <span className="text-default-600 text-xs">API by</span>
          <p className="text-primary text-xs">Pubchem</p>
        </Link>
      </div>
    </div>
  );
}
