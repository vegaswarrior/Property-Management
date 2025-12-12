import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { getLandlordBySubdomain } from "@/lib/actions/landlord.actions";
import { rentalApplicationSchema } from "@/lib/validators";
import { encryptField } from "@/lib/encrypt";

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host") || "";
    const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";

    const bareHost = host.split(":")[0].toLowerCase();
    const apexLower = apex.toLowerCase();

    let landlordId: string | null = null;
    let subdomain: string | null = null;

    // Production-style subdomain: subdomain.apex
    if (apexLower && bareHost.endsWith(`.${apexLower}`) && bareHost !== apexLower) {
      subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);
    }

    // Localhost-style subdomain: subdomain.localhost
    if (!subdomain && bareHost.endsWith('.localhost') && bareHost !== 'localhost') {
      subdomain = bareHost.slice(0, -'.localhost'.length);
    }

    if (subdomain) {
      const landlordResult = await getLandlordBySubdomain(subdomain);

      if (!landlordResult.success) {
        return NextResponse.json(
          { success: false, message: landlordResult.message || "Landlord not found for this subdomain." },
          { status: 404 }
        );
      }

      landlordId = landlordResult.landlord.id;
    }

    if (!landlordId) {
      return NextResponse.json(
        { success: false, message: "Missing or invalid landlord context for this request." },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    // Validate input with Zod
    const validationResult = rentalApplicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: validationResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }, 
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify the property belongs to this landlord (if propertySlug is provided)
    if (data.propertySlug) {
      const property = await prisma.property.findFirst({
        where: {
          slug: data.propertySlug,
          landlordId,
        },
      });

      if (!property) {
        return NextResponse.json(
          { success: false, message: "Property not found or does not belong to this landlord" },
          { status: 403 }
        );
      }
    }

    // Encrypt SSN - NEVER store in plain text
    const encryptedSsn = data.ssn ? await encryptField(data.ssn) : null;

    // Build notes WITHOUT SSN (security: SSN should never be in notes)
    const notesCombined = [
      data.notes,
      data.age ? `Age: ${data.age}` : undefined,
      data.currentAddress ? `Address: ${data.currentAddress}` : undefined,
      data.currentEmployer ? `Employer: ${data.currentEmployer}` : undefined,
      data.monthlySalary ? `Salary (monthly): ${data.monthlySalary}` : undefined,
      data.yearlySalary ? `Salary (yearly): ${data.yearlySalary}` : undefined,
      data.hasPets ? `Has pets: ${data.hasPets}` : undefined,
      data.petCount ? `Number of pets: ${data.petCount}` : undefined,
      data.hasPets && data.hasPets.toLowerCase().startsWith("y")
        ? "Note: Applicant was informed that a $300 annual pet fee is added for pets."
        : undefined,
      data.propertySlug ? `Property: ${data.propertySlug}` : undefined,
      // SSN is NOT included in notes - it's stored separately encrypted
    ]
      .filter(Boolean)
      .join("\n");

    const applicantId = session.user.id as string;

    // Verify applicant is not trying to apply to a property they don't have access to
    const unit = data.propertySlug
      ? await prisma.unit.findFirst({
          where: {
            isAvailable: true,
            property: {
              slug: data.propertySlug,
              landlordId,
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : null;

    await prisma.rentalApplication.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        notes: notesCombined,
        encryptedSsn, // Store encrypted SSN separately
        status: "pending",
        propertySlug: data.propertySlug || null,
        unitId: unit?.id ?? null,
        applicantId,
      },
    });

    revalidatePath("/admin/applications");

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error without exposing sensitive details
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // In production, use a proper logging service instead of console.error
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error("Application error", errorMessage);
    }
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
