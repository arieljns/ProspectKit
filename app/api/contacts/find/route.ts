import { xai } from '@ai-sdk/xai';
import { generateObject } from 'ai';
import { getCompanyById } from '@/lib/actions/companies';
import { createContact } from '@/lib/actions/contacts';
import { contactFinderSchema } from '@/lib/ai/contact-finder-schema';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return Response.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // 1. Get company info
    const companyResult = await getCompanyById(companyId);
    if (!companyResult.success) {
      return Response.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const company = companyResult.data!;

    // 2. Use AI to find contacts via Live Search (LinkedIn only)
    const systemPrompt = `You are a Sales Development Representative (SDR) assistant.
Your job is to find key contacts and decision makers at a given company using Live Search.

IMPORTANT:
- Use Live Search to find real contacts from LinkedIn
- Return ONLY contacts you find through search results
- Do NOT make up or invent names
- Focus on finding people currently working at the company
- Return approximately 5 contacts (or fewer if less are found)

Extract:
- Full name
- Current job title
- Department (if identifiable from title or profile)
- LinkedIn profile URL`;

    const userPrompt = `Find key contacts at: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ''}
${company.website ? `Website: ${company.website}` : ''}
${company.description ? `Description: ${company.description}` : ''}

Search LinkedIn for people currently working at ${company.companyName}.
Look for contacts across different departments and roles.

Search queries to try:
- site:linkedin.com ${company.companyName} employee
- site:linkedin.com "${company.companyName}" current position
- site:linkedin.com/in ${company.companyName}

Return up to 5 contacts with their name, title, department (optional), and LinkedIn URL.`;

    const { object: result } = await generateObject({
      model: xai('grok-4-fast-non-reasoning-latest'),
      schema: contactFinderSchema,
      schemaName: 'ContactFinderResult',
      schemaDescription:
        'Key contacts found at a company via LinkedIn search',
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: 'on',
            returnCitations: false,
            maxSearchResults: 10,
            sources: [
              {
                type: 'web',
                allowedWebsites: ['linkedin.com'],
              },
            ],
          },
        },
      },
    });

    // 3. Save contacts to database
    const savePromises = result.contacts.map((contact) =>
      createContact({
        companyId: company.id,
        name: contact.name,
        title: contact.title,
        department: contact.department || null,
        linkedinUrl: contact.linkedinUrl || null,
        contactStatus: 'new',
        priority: 'Low',
        lastContactedAt: null,
        notes: null,
      })
    );

    const saveResults = await Promise.all(savePromises);
    const successCount = saveResults.filter((r) => r.success).length;
    const failCount = saveResults.filter((r) => !r.success).length;

    // 4. Return success
    return Response.json({
      success: true,
      data: {
        companyId,
        companyName: company.companyName,
        contactsFound: result.contacts.length,
        contactsSaved: successCount,
        contactsFailed: failCount,
      },
    });
  } catch (error) {
    console.error('Contact finder error:', error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to find contacts',
      },
      { status: 500 }
    );
  }
}
