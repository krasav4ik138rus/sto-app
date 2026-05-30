import 'dotenv/config'

import { createPrisma } from '../src/db'
import { hashPassword } from '../src/auth/passwords'
import type { WorkOrderStatus } from '../src/generated/prisma/enums'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://superuser:superpassword@localhost:54329/autoservice_app?schema=public'

const devPassword = 'DevPassword123!'

const prisma = createPrisma(databaseUrl)

type StaffSeed = {
  email: string
  displayName: string
  fullName: string
  role: 'MECHANIC' | 'MASTER' | 'DIRECTOR' | 'ADMIN'
  serviceCenter: boolean
}

const staffSeeds: StaffSeed[] = [
  {
    email: 'mechanic@example.com',
    displayName: 'Demo Mechanic',
    fullName: 'Demo Mechanic',
    role: 'MECHANIC',
    serviceCenter: true,
  },
  {
    email: 'master@example.com',
    displayName: 'Demo Master',
    fullName: 'Demo Master',
    role: 'MASTER',
    serviceCenter: true,
  },
  {
    email: 'director@example.com',
    displayName: 'Demo Director',
    fullName: 'Demo Director',
    role: 'DIRECTOR',
    serviceCenter: false,
  },
  {
    email: 'admin@example.com',
    displayName: 'Demo Admin',
    fullName: 'Demo Admin',
    role: 'ADMIN',
    serviceCenter: false,
  },
]

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-autoservice' },
    update: {
      name: 'Demo AutoService',
      timezone: 'Europe/Helsinki',
      isActive: true,
    },
    create: {
      name: 'Demo AutoService',
      slug: 'demo-autoservice',
      timezone: 'Europe/Helsinki',
      isActive: true,
    },
  })

  const serviceCenter = await upsertServiceCenter(organization.id)
  const staff = await upsertStaff(organization.id, serviceCenter.id)
  const customers = await upsertCustomers(organization.id)
  const vehicles = await upsertVehicles(organization.id, customers)
  const workOrders = await upsertWorkOrders(organization.id, serviceCenter.id, staff, customers, vehicles)

  await upsertInspectionDiagnosticExamples(organization.id, staff.mechanic.id, workOrders.wo0002.id)
  await upsertSeedAudit(organization.id, staff.admin.id)

  console.log('STO dev seed completed')
  console.table({
    organization: organization.slug,
    serviceCenter: serviceCenter.name,
    mechanic: 'mechanic@example.com',
    master: 'master@example.com',
    director: 'director@example.com',
    admin: 'admin@example.com',
    password: devPassword,
  })
}

async function upsertServiceCenter(organizationId: string) {
  const existing = await prisma.serviceCenter.findFirst({
    where: {
      organizationId,
      name: 'Main STO',
    },
  })

  const data = {
    organizationId,
    name: 'Main STO',
    address: 'Local dev service center',
    phone: '+10000000000',
    isActive: true,
  }

  if (existing) {
    return prisma.serviceCenter.update({
      where: { id: existing.id },
      data,
    })
  }

  return prisma.serviceCenter.create({ data })
}

async function upsertStaff(organizationId: string, serviceCenterId: string) {
  const passwordHash = await hashPassword(devPassword)
  const result = {} as Record<StaffSeed['role'], { id: string }>

  for (const seed of staffSeeds) {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        passwordHash,
        displayName: seed.displayName,
      },
      create: {
        email: seed.email,
        passwordHash,
        displayName: seed.displayName,
      },
    })

    const staffProfile = await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {
        organizationId,
        serviceCenterId: seed.serviceCenter ? serviceCenterId : null,
        fullName: seed.fullName,
        role: seed.role,
        isActive: true,
      },
      create: {
        userId: user.id,
        organizationId,
        serviceCenterId: seed.serviceCenter ? serviceCenterId : null,
        fullName: seed.fullName,
        role: seed.role,
        isActive: true,
      },
    })

    result[seed.role] = staffProfile
  }

  return {
    mechanic: result.MECHANIC,
    master: result.MASTER,
    director: result.DIRECTOR,
    admin: result.ADMIN,
  }
}

async function upsertCustomers(organizationId: string) {
  const seeds = [
    { key: 'ivan', name: 'Иван Петров', phone: '+79990000001' },
    { key: 'sergey', name: 'Сергей Иванов', phone: '+79990000002' },
    { key: 'anna', name: 'Анна Смирнова', phone: '+79990000003' },
  ] as const
  const result = {} as Record<(typeof seeds)[number]['key'], { id: string }>

  for (const seed of seeds) {
    const existing = await prisma.customer.findFirst({
      where: {
        organizationId,
        phone: seed.phone,
      },
    })

    const data = {
      organizationId,
      name: seed.name,
      phone: seed.phone,
      email: null,
      notes: 'Local dev seed customer',
    }

    const customer = existing
      ? await prisma.customer.update({ where: { id: existing.id }, data })
      : await prisma.customer.create({ data })
    result[seed.key] = customer
  }

  return result
}

async function upsertVehicles(
  organizationId: string,
  customers: Record<'ivan' | 'sergey' | 'anna', { id: string }>,
) {
  const seeds = [
    {
      key: 'camry',
      customerId: customers.ivan.id,
      brand: 'Toyota',
      model: 'Camry',
      brandModel: 'Toyota Camry',
      vin: 'JTDBE32K620123456',
      plate: 'A001AA',
      engineSpec: '2.5',
      year: 2018,
      currentMileage: 152000,
    },
    {
      key: 'x5',
      customerId: customers.sergey.id,
      brand: 'BMW',
      model: 'X5',
      brandModel: 'BMW X5',
      vin: 'WBAKS410500123456',
      plate: 'B002BB',
      engineSpec: '3.0 diesel',
      year: 2016,
      currentMileage: 211000,
    },
    {
      key: 'solaris',
      customerId: customers.anna.id,
      brand: 'Hyundai',
      model: 'Solaris',
      brandModel: 'Hyundai Solaris',
      vin: 'Z94CT41CAJR123456',
      plate: 'C003CC',
      engineSpec: '1.6',
      year: 2020,
      currentMileage: 87000,
    },
  ] as const
  const result = {} as Record<(typeof seeds)[number]['key'], { id: string }>

  for (const seed of seeds) {
    const existing = await prisma.vehicle.findFirst({
      where: {
        organizationId,
        vin: seed.vin,
      },
    })
    const { key: _key, ...data } = {
      ...seed,
      organizationId,
      notes: 'Local dev seed vehicle',
    }

    const vehicle = existing
      ? await prisma.vehicle.update({ where: { id: existing.id }, data })
      : await prisma.vehicle.create({ data })
    result[seed.key] = vehicle
  }

  return result
}

async function upsertWorkOrders(
  organizationId: string,
  serviceCenterId: string,
  staff: {
    mechanic: { id: string }
    master: { id: string }
    admin: { id: string }
  },
  customers: Record<'ivan' | 'sergey' | 'anna', { id: string }>,
  vehicles: Record<'camry' | 'x5' | 'solaris', { id: string }>,
) {
  const seeds = [
    {
      key: 'wo0001',
      number: 'WO-0001',
      customerId: customers.ivan.id,
      vehicleId: vehicles.camry.id,
      status: 'OPEN',
      visitReason: 'Плановый осмотр',
      mileage: 152000,
      closedAt: null,
    },
    {
      key: 'wo0002',
      number: 'WO-0002',
      customerId: customers.sergey.id,
      vehicleId: vehicles.x5.id,
      status: 'IN_PROGRESS',
      visitReason: 'Стук в передней подвеске',
      mileage: 211000,
      closedAt: null,
    },
    {
      key: 'wo0003',
      number: 'WO-0003',
      customerId: customers.anna.id,
      vehicleId: vehicles.solaris.id,
      status: 'AWAITING_APPROVAL',
      visitReason: 'Проверка тормозной системы',
      mileage: 87000,
      closedAt: null,
    },
    {
      key: 'wo0004',
      number: 'WO-0004',
      customerId: customers.ivan.id,
      vehicleId: vehicles.camry.id,
      status: 'CLOSED',
      visitReason: 'Замена масла и проверка жидкостей',
      mileage: 150500,
      closedAt: new Date('2026-05-01T10:00:00.000Z'),
    },
  ] as const
  const result = {} as Record<(typeof seeds)[number]['key'], { id: string }>

  for (const seed of seeds) {
    const existing = await prisma.workOrder.findFirst({
      where: {
        organizationId,
        number: seed.number,
      },
    })
    const data = {
      organizationId,
      serviceCenterId,
      customerId: seed.customerId,
      vehicleId: seed.vehicleId,
      number: seed.number,
      status: seed.status as WorkOrderStatus,
      visitReason: seed.visitReason,
      mileage: seed.mileage,
      responsibleStaffProfileId: staff.mechanic.id,
      createdByStaffProfileId: staff.master.id,
      closedAt: seed.closedAt,
    }

    const workOrder = existing
      ? await prisma.workOrder.update({ where: { id: existing.id }, data })
      : await prisma.workOrder.create({ data })

    await ensureStatusHistory({
      organizationId,
      workOrderId: workOrder.id,
      fromStatus: null,
      toStatus: seed.status as WorkOrderStatus,
      changedByStaffProfileId: staff.master.id,
      comment: 'Created by local dev seed',
    })
    await ensureWorkOrderAudit(organizationId, staff.admin.id, workOrder.id)
    result[seed.key] = workOrder
  }

  await ensureStatusHistory({
    organizationId,
    workOrderId: result.wo0002.id,
    fromStatus: 'OPEN',
    toStatus: 'IN_PROGRESS',
    changedByStaffProfileId: staff.master.id,
    comment: 'Moved to IN_PROGRESS by local dev seed',
  })
  await ensureStatusHistory({
    organizationId,
    workOrderId: result.wo0003.id,
    fromStatus: 'IN_PROGRESS',
    toStatus: 'AWAITING_APPROVAL',
    changedByStaffProfileId: staff.master.id,
    comment: 'Moved to AWAITING_APPROVAL by local dev seed',
  })
  await ensureStatusHistory({
    organizationId,
    workOrderId: result.wo0004.id,
    fromStatus: 'COMPLETED',
    toStatus: 'CLOSED',
    changedByStaffProfileId: staff.master.id,
    comment: 'Closed by local dev seed',
  })

  return result
}

async function upsertInspectionDiagnosticExamples(
  organizationId: string,
  mechanicStaffProfileId: string,
  workOrderId: string,
) {
  const inspectionAct = await prisma.inspectionAct.upsert({
    where: { workOrderId },
    update: {
      dataJson: {
        schemaVersion: 1,
        values: {
          low_beam: 'urgent',
          coolant: 'ниже нормы',
          inspection_recommendations: 'Проверить свет и систему охлаждения',
        },
      },
      schemaVersion: 1,
      createdByStaffProfileId: mechanicStaffProfileId,
      updatedByStaffProfileId: mechanicStaffProfileId,
    },
    create: {
      organizationId,
      workOrderId,
      dataJson: {
        schemaVersion: 1,
        values: {
          low_beam: 'urgent',
          coolant: 'ниже нормы',
          inspection_recommendations: 'Проверить свет и систему охлаждения',
        },
      },
      schemaVersion: 1,
      createdByStaffProfileId: mechanicStaffProfileId,
      updatedByStaffProfileId: mechanicStaffProfileId,
    },
  })

  const existingDiagnostic = await prisma.diagnostic.findFirst({
    where: {
      workOrderId,
      otherRecommendations: 'Local dev seed diagnostic',
    },
  })
  const diagnosticData = {
    organizationId,
    workOrderId,
    dataJson: {
      schemaVersion: 1,
      values: {
        front_shock_absorber: {
          left: {
            status: 'not_ok',
            partsPrice: '10000',
            servicePrice: '3000',
            comment: 'Требуется замена',
          },
          right: {
            status: 'ok',
            partsPrice: null,
            servicePrice: null,
            comment: null,
          },
        },
      },
      totals: {
        partsTotal: '10000',
        serviceTotal: '3000',
        grandTotal: '13000',
      },
    },
    schemaVersion: 1,
    otherRecommendations: 'Local dev seed diagnostic',
    alignmentComment: null,
    partsTotal: '10000',
    serviceTotal: '3000',
    grandTotal: '13000',
    executorStaffProfileId: mechanicStaffProfileId,
    createdByStaffProfileId: mechanicStaffProfileId,
    updatedByStaffProfileId: mechanicStaffProfileId,
  }
  const diagnostic = existingDiagnostic
    ? await prisma.diagnostic.update({ where: { id: existingDiagnostic.id }, data: diagnosticData })
    : await prisma.diagnostic.create({ data: diagnosticData })

  const recommendation = await upsertRecommendation({
    organizationId,
    workOrderId,
    diagnosticId: diagnostic.id,
    inspectionActId: inspectionAct.id,
    text: 'Заменить передний левый амортизатор',
    createdByStaffProfileId: mechanicStaffProfileId,
  })

  await upsertAttachment({
    organizationId,
    workOrderId,
    diagnosticId: diagnostic.id,
    recommendationId: recommendation.id,
    createdByStaffProfileId: mechanicStaffProfileId,
  })
}

async function upsertRecommendation(input: {
  organizationId: string
  workOrderId: string
  diagnosticId: string
  inspectionActId: string
  text: string
  createdByStaffProfileId: string
}) {
  const existing = await prisma.recommendation.findFirst({
    where: {
      workOrderId: input.workOrderId,
      text: input.text,
    },
  })
  const data = {
    organizationId: input.organizationId,
    workOrderId: input.workOrderId,
    diagnosticId: input.diagnosticId,
    inspectionActId: input.inspectionActId,
    text: input.text,
    status: 'SUGGESTED' as const,
    partsPrice: '10000',
    servicePrice: '3000',
    totalPrice: '13000',
    createdByStaffProfileId: input.createdByStaffProfileId,
    updatedByStaffProfileId: input.createdByStaffProfileId,
  }

  return existing
    ? prisma.recommendation.update({ where: { id: existing.id }, data })
    : prisma.recommendation.create({ data })
}

async function upsertAttachment(input: {
  organizationId: string
  workOrderId: string
  diagnosticId: string
  recommendationId: string
  createdByStaffProfileId: string
}) {
  const storageKey = 'dev/wo-0002/front-suspension-left.jpg'
  const existing = await prisma.orderAttachment.findFirst({
    where: { storageKey },
  })
  const data = {
    organizationId: input.organizationId,
    workOrderId: input.workOrderId,
    inspectionActId: null,
    diagnosticId: input.diagnosticId,
    recommendationId: input.recommendationId,
    type: 'PHOTO' as const,
    visibility: 'INTERNAL' as const,
    storageKey,
    fileUrl: null,
    originalFilename: 'front-suspension-left.jpg',
    mimeType: 'image/jpeg',
    byteSize: 123456,
    caption: 'Передняя подвеска слева, dev metadata only',
    createdByStaffProfileId: input.createdByStaffProfileId,
    deletedAt: null,
  }

  return existing
    ? prisma.orderAttachment.update({ where: { id: existing.id }, data })
    : prisma.orderAttachment.create({ data })
}

async function ensureStatusHistory(input: {
  organizationId: string
  workOrderId: string
  fromStatus: WorkOrderStatus | null
  toStatus: WorkOrderStatus
  changedByStaffProfileId: string
  comment: string
}) {
  const existing = await prisma.workOrderStatusHistory.findFirst({
    where: {
      workOrderId: input.workOrderId,
      comment: input.comment,
    },
  })

  const data = {
    organizationId: input.organizationId,
    workOrderId: input.workOrderId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    comment: input.comment,
    changedByStaffProfileId: input.changedByStaffProfileId,
  }

  return existing
    ? prisma.workOrderStatusHistory.update({ where: { id: existing.id }, data })
    : prisma.workOrderStatusHistory.create({ data })
}

async function ensureWorkOrderAudit(
  organizationId: string,
  staffProfileId: string,
  workOrderId: string,
) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      entityType: 'work_order',
      entityId: workOrderId,
      action: 'work_order_created_seed',
    },
  })

  if (existing) return existing

  return prisma.auditLog.create({
    data: {
      organizationId,
      staffProfileId,
      entityType: 'work_order',
      entityId: workOrderId,
      action: 'work_order_created_seed',
      payloadJson: {
        source: 'seed:sto',
      },
    },
  })
}

async function upsertSeedAudit(organizationId: string, staffProfileId: string) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      entityType: 'seed',
      entityId: 'demo-autoservice',
      action: 'seed_created_or_updated',
    },
  })

  if (existing) return existing

  return prisma.auditLog.create({
    data: {
      organizationId,
      staffProfileId,
      entityType: 'seed',
      entityId: 'demo-autoservice',
      action: 'seed_created_or_updated',
      payloadJson: {
        script: 'backend/scripts/seed-sto-dev.ts',
      },
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
