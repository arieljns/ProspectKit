"use server";

import { db } from "../db";
import {
  companies,
  insertCompanySchema,
  type NewCompanyParams,
} from "../db/schema/companies";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { findCompanyById } from "@/lib/server/repositories/companies-repo";

/**
 * Get all companies
 */
export const getAllCompanies = async () => {
  try {
    const allCompanies = await db
      .select()
      .from(companies)
      .orderBy(desc(companies.createdAt));

    return { success: true, data: allCompanies };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch companies",
    };
  }
};

/**
 * Get a single company by ID
 */
export const getCompanyById = async (id: string) => {
  try {
    const company = await findCompanyById(id);

    if (!company) {
      return { success: false, error: "Company not found" };
    }

    return { success: true, data: company };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch company",
    };
  }
};

/**
 * Create a new company
 */
export const createCompany = async (input: NewCompanyParams) => {
  try {
    const validatedData = insertCompanySchema.parse(input);

    const [company] = await db
      .insert(companies)
      .values(validatedData)
      .returning();

    revalidatePath("/app/dashboard");
    return { success: true, data: company };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};

/**
 * Update a company
 */
export const updateCompany = async (
  id: string,
  input: Partial<NewCompanyParams>,
) => {
  try {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    if (!updatedCompany) {
      return { success: false, error: "Company not found" };
    }

    revalidatePath("/app/dashboard");
    return { success: true, data: updatedCompany };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update company",
    };
  }
};

/**
 * Delete a company (will cascade delete reports)
 */
export const deleteCompany = async (id: string) => {
  try {
    const [deletedCompany] = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();

    if (!deletedCompany) {
      return { success: false, error: "Company not found" };
    }

    revalidatePath("/app/dashboard");
    return {
      success: true,
      message: `Company ${deletedCompany.companyName} deleted`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete company",
    };
  }
};

/**
 * Update company priority
 */
export const updateCompanyPriority = async (
  id: string,
  priority: "High" | "Medium" | "Low",
) => {
  try {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        priority,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    if (!updatedCompany) {
      return { success: false, error: "Company not found" };
    }

    revalidatePath("/app/dashboard");
    return { success: true, data: updatedCompany };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update priority",
    };
  }
};

/**
 * Update company report status
 */
export const updateCompanyReportStatus = async (
  id: string,
  reportStatus: "none" | "generating" | "completed" | "failed",
) => {
  try {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        reportStatus,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();

    if (!updatedCompany) {
      return { success: false, error: "Company not found" };
    }

    revalidatePath("/app/dashboard");
    return { success: true, data: updatedCompany };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update report status",
    };
  }
};
