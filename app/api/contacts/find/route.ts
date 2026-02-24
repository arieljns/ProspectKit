import { findContactsForCompany } from "@/lib/server/services/contacts/find-contacts-for-company";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companyId?: string };
    const result = await findContactsForCompany({ companyId: body.companyId });

    if (result.ok) {
      return Response.json({
        success: true,
        data: result.data,
      });
    }

    if (result.error.code === "INVALID_INPUT") {
      return Response.json(
        { success: false, error: result.error.message },
        { status: 400 },
      );
    }

    if (result.error.code === "COMPANY_NOT_FOUND") {
      return Response.json(
        { success: false, error: result.error.message },
        { status: 404 },
      );
    }

    if (result.error.code === "NO_CONTACTS_FOUND") {
      return Response.json({
        success: false,
        error: result.error.message,
        data: result.error.details,
      });
    }

    return Response.json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  } catch (error) {
    console.error("Contact finder error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to find contacts",
      },
      { status: 500 },
    );
  }
}
