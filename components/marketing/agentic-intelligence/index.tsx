"use client";
import React from "react";
import { Container } from "../container";
import { Badge } from "../badge";
import { SubHeading } from "../subheading";
import { SectionHeading } from "../section-heading";
import { Card, CardDescription, CardTitle } from "./card";
import {
  BrainIcon,
  FingerprintIcon,
  MouseBoxIcon,
  NativeIcon,
  RealtimeSyncIcon,
  SDKIcon,
} from "@/icons/bento-icons";
import {
  DiscoverCompaniesSkeleton,
  ManageLeadsSkeleton,
  PipelineAnalyticsSkeleton,
} from "./skeletons";
import { coreFeatureCards } from "@/lib/marketing/landing-content";

export const AgenticIntelligence = () => {
  return (
    <Container id="core-features" className="border-divide border-x">
      <div className="flex flex-col items-center py-16">
        <Badge text="Core capabilities" />
        <SectionHeading className="mt-4">
          Product features in the prototype today
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
          The main working surfaces are Discover Companies, Manage Leads, and
          Pipeline Analytics.
        </SubHeading>
        <div className="border-divide divide-divide mt-16 grid grid-cols-1 divide-y border-y md:grid-cols-2 md:divide-x">
          <Card className="overflow-hidden mask-b-from-80%">
            <div className="flex items-center gap-2">
              <BrainIcon />
              <CardTitle>{coreFeatureCards[1].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[1].description}</CardDescription>
            <DiscoverCompaniesSkeleton />
          </Card>
          <Card className="overflow-hidden mask-b-from-80%">
            <div className="flex items-center gap-2">
              <MouseBoxIcon />
              <CardTitle>{coreFeatureCards[0].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[0].description}</CardDescription>
            <ManageLeadsSkeleton />
          </Card>
        </div>
        <div className="w-full">
          <Card className="relative w-full max-w-none overflow-hidden">
            <div className="pointer-events-none absolute inset-0 h-full w-full bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] mask-radial-from-10% [background-size:10px_10px]"></div>
            <div className="flex items-center gap-2">
              <NativeIcon />
              <CardTitle>{coreFeatureCards[5].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[5].description}</CardDescription>
            <PipelineAnalyticsSkeleton />
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2">
              <FingerprintIcon />
              <CardTitle>{coreFeatureCards[2].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[2].description}</CardDescription>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <RealtimeSyncIcon />
              <CardTitle>{coreFeatureCards[3].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[3].description}</CardDescription>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <SDKIcon />
              <CardTitle>{coreFeatureCards[4].title}</CardTitle>
            </div>
            <CardDescription>{coreFeatureCards[4].description}</CardDescription>
          </Card>
        </div>
      </div>
    </Container>
  );
};
