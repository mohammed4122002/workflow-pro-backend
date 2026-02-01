import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@workflowpro.local' },
    update: {},
    create: {
      email: 'admin@workflowpro.local',
      fullName: 'Admin User',
      role: 'ADMIN',
      department: 'Administration',
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@workflowpro.local' },
    update: {},
    create: {
      email: 'manager@workflowpro.local',
      fullName: 'Manager User',
      role: 'MANAGER',
      department: 'Operations',
      isActive: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@workflowpro.local' },
    update: {},
    create: {
      email: 'employee@workflowpro.local',
      fullName: 'Employee User',
      role: 'EMPLOYEE',
      department: 'Engineering',
      isActive: true,
    },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      userId: employee.id,
      jobTitle: 'Software Engineer',
      salaryBase: '5000.00',
      hireDate: new Date('2024-06-01'),
      nationalId: 'A123456789',
      address: 'Riyadh, KSA',
    },
  });

  const task1 =
    (await prisma.task.findFirst({
      where: { title: 'Setup repository', createdById: manager.id },
    })) ??
    (await prisma.task.create({
      data: {
        title: 'Setup repository',
        description: 'Initialize project structure and configs.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2026-02-05'),
        createdById: manager.id,
        assignedToId: employee.id,
      },
    }));

  const task2 =
    (await prisma.task.findFirst({
      where: { title: 'Draft HR policies', createdById: manager.id },
    })) ??
    (await prisma.task.create({
      data: {
        title: 'Draft HR policies',
        description: 'Prepare initial HR policies and leave rules.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2026-02-10'),
        createdById: manager.id,
        assignedToId: null,
      },
    }));

  const commentExists = await prisma.taskComment.findFirst({
    where: {
      taskId: task1.id,
      userId: employee.id,
      content: 'Working on initial setup.',
    },
  });

  if (!commentExists) {
    await prisma.taskComment.create({
      data: {
        taskId: task1.id,
        userId: employee.id,
        content: 'Working on initial setup.',
      },
    });
  }

  const comment2Exists = await prisma.taskComment.findFirst({
    where: {
      taskId: task1.id,
      userId: manager.id,
      content: 'Please prioritize environment setup.',
    },
  });

  if (!comment2Exists) {
    await prisma.taskComment.create({
      data: {
        taskId: task1.id,
        userId: manager.id,
        content: 'Please prioritize environment setup.',
      },
    });
  }

  const attendanceDate = new Date('2026-01-15');
  const attendanceExists = await prisma.attendance.findFirst({
    where: { userId: employee.id, date: attendanceDate },
  });

  if (!attendanceExists) {
    await prisma.attendance.create({
      data: {
        userId: employee.id,
        date: attendanceDate,
        checkIn: new Date('2026-01-15T08:15:00.000Z'),
        checkOut: new Date('2026-01-15T16:45:00.000Z'),
        status: 'PRESENT',
        note: 'On time',
      },
    });
  }

  const financialMonth = '2026-01';
  const financialExists = await prisma.financialRecord.findFirst({
    where: { userId: employee.id, month: financialMonth },
  });

  if (!financialExists) {
    await prisma.financialRecord.create({
      data: {
        userId: employee.id,
        month: financialMonth,
        salaryPaid: '5000.00',
        bonuses: '250.00',
        deductions: '100.00',
        notes: 'January payroll',
      },
    });
  }

  const leaveExists = await prisma.leaveRequest.findFirst({
    where: {
      userId: employee.id,
      fromDate: new Date('2026-02-01'),
      toDate: new Date('2026-02-03'),
    },
  });

  if (!leaveExists) {
    await prisma.leaveRequest.create({
      data: {
        userId: employee.id,
        fromDate: new Date('2026-02-01'),
        toDate: new Date('2026-02-03'),
        type: 'ANNUAL',
        reason: 'Family event',
        status: 'PENDING',
        decidedById: null,
        decidedAt: null,
      },
    });
  }

  const reportExists = await prisma.reportSnapshot.findFirst({
    where: {
      type: 'HR_SUMMARY',
      rangeFrom: new Date('2026-01-01'),
      rangeTo: new Date('2026-01-31'),
    },
  });

  if (!reportExists) {
    await prisma.reportSnapshot.create({
      data: {
        type: 'HR_SUMMARY',
        rangeFrom: new Date('2026-01-01'),
        rangeTo: new Date('2026-01-31'),
        data: {
          attendance: { present: 1, late: 0, absent: 0, leave: 0 },
          leaves: { pending: 1, approved: 0, rejected: 0 },
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
