"use client";
import React, { useState } from "react";
import { Container } from "./container";
import { Badge } from "./badge";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";
import {
  DevopsIcon,
  PhoneIcon,
  TruckIcon,
  DatabaseIcon,
  WalletIcon,
  GraphIcon,
} from "@/icons/card-icons";
import { Scale } from "./scale";
import { motion } from "motion/react";
import { landingUseCases } from "@/lib/marketing/landing-content";

const useCaseIcons = [
  <DevopsIcon className="text-brand size-6" key="devops" />,
  <GraphIcon className="text-brand size-6" key="graph" />,
  <TruckIcon className="text-brand size-6" key="truck" />,
  <PhoneIcon className="text-brand size-6" key="phone" />,
  <DatabaseIcon className="text-brand size-6" key="database" />,
  <WalletIcon className="text-brand size-6" key="wallet" />,
];

export const UseCases = () => {
  const [activeUseCase, setActiveUseCase] = useState<number | null>(null);
  return (
    <Container
      id="use-cases"
      className="border-divide relative overflow-hidden border-x px-4 md:px-8"
    >
      <div className="relative flex flex-col items-center py-20">
        <Badge text="Use Cases" />
        <SectionHeading className="mt-4">
          Three common ways teams use ProspectKit
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          Use it to establish a repeatable outbound loop without adopting a full
          CRM, sequence tool, or data platform.
        </SubHeading>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {landingUseCases.map((useCase, index) => (
            <div
              onMouseEnter={() => setActiveUseCase(index)}
              key={useCase.title}
              className="relative"
            >
              {activeUseCase === index && (
                <motion.div
                  layoutId="scale"
                  className="absolute inset-0 z-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                >
                  <Scale />
                </motion.div>
              )}
              <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
                <div className="flex items-center gap-2">{useCaseIcons[index]}</div>
                <h3 className="mt-4 mb-2 text-lg font-medium">
                  {useCase.title}
                </h3>
                <p className="text-gray-600">{useCase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};
