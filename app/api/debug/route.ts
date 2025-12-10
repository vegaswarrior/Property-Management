import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  const properties = await prisma.property.findMany({
    include: { units: true },
  });

  const applications = await prisma.rentalApplication.findMany({
    include: {
      unit: true,
      applicant: { select: { id: true, email: true, name: true } },
    },
  });

  const leases = await prisma.lease.findMany({
    include: {
      unit: { include: { property: true } },
      tenant: { select: { id: true, email: true, name: true } },
      rentPayments: true,
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({
    properties,
    applications,
    leases,
    users,
  });
}
