import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { auth } from "@/auth";
import { getLandlordBySubdomain } from "@/lib/actions/landlord.actions";

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host") || "";
    const apex = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";

    const bareHost = host.split(":")[0].toLowerCase();
    const apexLower = apex.toLowerCase();

    let landlordId: string | null = null;

    if (apexLower && bareHost.endsWith(`.${apexLower}`) && bareHost !== apexLower) {
      const subdomain = bareHost.slice(0, bareHost.length - apexLower.length - 1);

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

    const body = await req.json();
    const {
      fullName,
      age,
      email,
      phone,
      currentAddress,
      currentEmployer,
      monthlySalary,
      yearlySalary,
      hasPets,
      petCount,
      ssn,
      notes,
      propertySlug,
    } = body as {
      fullName?: string;
      age?: string;
      email?: string;
      phone?: string;
      currentAddress?: string;
      currentEmployer?: string;
      monthlySalary?: string;
      yearlySalary?: string;
      hasPets?: string;
      petCount?: string;
      ssn?: string;
      notes?: string;
      propertySlug?: string;
    };

    if (!fullName || !email || !phone || !currentAddress || !currentEmployer || !ssn) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const notesCombined = [
      notes,
      age ? `Age: ${age}` : undefined,
      currentAddress ? `Address: ${currentAddress}` : undefined,
      currentEmployer ? `Employer: ${currentEmployer}` : undefined,
      monthlySalary ? `Salary (monthly): ${monthlySalary}` : undefined,
      yearlySalary ? `Salary (yearly): ${yearlySalary}` : undefined,
      hasPets ? `Has pets: ${hasPets}` : undefined,
      petCount ? `Number of pets: ${petCount}` : undefined,
      hasPets && hasPets.toLowerCase().startsWith("y")
        ? "Note: Applicant was informed that a $300 annual pet fee is added for pets."
        : undefined,
      propertySlug ? `Property: ${propertySlug}` : undefined,
      ssn ? `SSN: ${ssn}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const applicantId = session.user.id as string;

    const unit = propertySlug
      ? await prisma.unit.findFirst({
          where: {
            isAvailable: true,
            property: {
              slug: propertySlug,
              landlordId,
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : null;

    await prisma.rentalApplication.create({
      data: {
        fullName,
        email,
        phone,
        notes: notesCombined,
        status: "pending",
        propertySlug: propertySlug || null,
        unitId: unit?.id ?? null,
        applicantId,
      },
    });

    revalidatePath("/admin/applications");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application error", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
