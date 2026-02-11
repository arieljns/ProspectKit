import React from "react";
import { Container } from "./container";
import { DivideX } from "./divide";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";
import { Button } from "./button";
import Image from "next/image";
import { PROSPECTKIT_CONTACT_MAILTO } from "@/lib/marketing/links";

export const Security = () => {
  return (
    <>
      <Container id="security" className="border-divide border-x">
        <h2 className="pt-10 pb-5 text-center font-mono text-sm tracking-tight text-neutral-500 uppercase md:pt-20 md:pb-10 dark:text-neutral-400">
          FOR SECURITY-MINDED STARTUPS
        </h2>
      </Container>
      <DivideX />
      <Container className="border-divide grid grid-cols-1 border-x bg-gray-100 px-8 py-12 md:grid-cols-2 dark:bg-neutral-900">
        <div>
          <SectionHeading className="text-left">
            Stay in control as you scale
          </SectionHeading>
          <SubHeading as="p" className="mt-4 text-left">
            ProspectKit is open-source and self-hostable, so your data handling
            and infrastructure choices stay in your hands.
          </SubHeading>
          <Button className="mt-4 mb-8 inline-block w-full md:w-auto" as="a" href={PROSPECTKIT_CONTACT_MAILTO}>
            Talk to us
          </Button>
        </div>
        <div className="flex items-center justify-center gap-10">
          <Image
            src="/marketing/logos/CCPA.png"
            alt="CCPA"
            height={100}
            width={100}
            className="h-auto w-14"
            draggable={false}
          />
          <Image
            src="/marketing/logos/GDPR.png"
            alt="GDPR"
            height={100}
            width={100}
            className="h-auto w-14"
            draggable={false}
          />
          <Image
            src="/marketing/logos/ISO.png"
            alt="ISO"
            height={100}
            width={100}
            className="h-auto w-14"
            draggable={false}
          />
        </div>
      </Container>
    </>
  );
};
