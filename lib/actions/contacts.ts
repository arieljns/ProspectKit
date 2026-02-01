'use server';

import { db } from '../db';
import { contacts, insertContactSchema, type NewContactParams } from '../db/schema/contacts';
import { companies } from '../db/schema/companies';
import { leadScores } from '../db/schema/lead-scores';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get all contacts with their company information and lead scores
 */
export const getAllContacts = async () => {
  try {
    const allContacts = await db
      .select({
        contact: contacts,
        company: companies,
        leadScore: leadScores,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .leftJoin(leadScores, eq(contacts.id, leadScores.contactId))
      .orderBy(desc(contacts.createdAt));

    return { success: true, data: allContacts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts',
    };
  }
};

/**
 * Get a single contact by ID
 */
export const getContactById = async (id: string) => {
  try {
    const [result] = await db
      .select({
        contact: contacts,
        company: companies,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.id, id))
      .limit(1);

    if (!result) {
      return { success: false, error: 'Contact not found' };
    }

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contact',
    };
  }
};

/**
 * Get all contacts for a specific company
 */
export const getContactsByCompanyId = async (companyId: string) => {
  try {
    const companyContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.companyId, companyId))
      .orderBy(desc(contacts.createdAt));

    return { success: true, data: companyContacts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts',
    };
  }
};

/**
 * Create a new contact
 */
export const createContact = async (input: NewContactParams) => {
  try {
    const validatedData = insertContactSchema.parse(input);

    const [contact] = await db
      .insert(contacts)
      .values(validatedData)
      .returning();

    revalidatePath('/contacts');
    revalidatePath('/dashboard');
    return { success: true, data: contact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact',
    };
  }
};

/**
 * Update a contact
 */
export const updateContact = async (
  id: string,
  input: Partial<NewContactParams>
) => {
  try {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      return { success: false, error: 'Contact not found' };
    }

    revalidatePath('/contacts');
    revalidatePath('/dashboard');
    return { success: true, data: updatedContact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
};

/**
 * Delete a contact
 */
export const deleteContact = async (id: string) => {
  try {
    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning();

    if (!deletedContact) {
      return { success: false, error: 'Contact not found' };
    }

    revalidatePath('/contacts');
    revalidatePath('/dashboard');
    return { success: true, message: `Contact ${deletedContact.name} deleted` };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
};

/**
 * Update contact status
 */
export const updateContactStatus = async (
  id: string,
  contactStatus: 'new' | 'contacted' | 'responded' | 'qualified' | 'not_interested'
) => {
  try {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        contactStatus,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      return { success: false, error: 'Contact not found' };
    }

    revalidatePath('/contacts');
    return { success: true, data: updatedContact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact status',
    };
  }
};

/**
 * Update contact priority
 */
export const updateContactPriority = async (
  id: string,
  priority: 'High' | 'Medium' | 'Low'
) => {
  try {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        priority,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      return { success: false, error: 'Contact not found' };
    }

    revalidatePath('/contacts');
    return { success: true, data: updatedContact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact priority',
    };
  }
};

/**
 * Update last contacted timestamp
 */
export const updateLastContacted = async (id: string) => {
  try {
    const [updatedContact] = await db
      .update(contacts)
      .set({
        lastContactedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();

    if (!updatedContact) {
      return { success: false, error: 'Contact not found' };
    }

    revalidatePath('/contacts');
    return { success: true, data: updatedContact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update last contacted time',
    };
  }
};
