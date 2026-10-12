import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const PASSWORD = "KasiBallDev123!";

const ageGroups = [
  { name: "U13", minAge: 12, maxAge: 13 },
  { name: "U15", minAge: 14, maxAge: 15 },
  { name: "U17", minAge: 16, maxAge: 17 },
];

const teamNames: Record<string, string[]> = {
  U13: [
    "Mamelodi Stars",
    "Soshanguve United",
    "Atteridgeville FC",
    "Ga-Rankuwa Young Lions",
    "Tembisa Juniors",
    "Mabopane City",
  ],
  U15: [
    "Mamelodi Stars",
    "Soshanguve United",
    "Atteridgeville FC",
    "Ga-Rankuwa Young Lions",
    "Tembisa Juniors",
    "Mabopane City",
  ],
  U17: [
    "Mamelodi Stars",
    "Soshanguve United",
    "Atteridgeville FC",
    "Ga-Rankuwa Young Lions",
    "Tembisa Juniors",
    "Mabopane City",
  ],
};

const firstNames = [
  "Thabo",
  "Kagiso",
  "Tshepo",
  "Karabo",
  "Neo",
  "Bongani",
  "Lebo",
  "Tumelo",
  "Katlego",
  "Lesego",
  "Mpho",
  "Refilwe",
  "Palesa",
  "Onalenna",
  "Boitumelo",
  "Keabetswe",
  "Kamohelo",
  "Olebogeng",
  "Amogelang",
  "Tlotlo",
];

const lastNames = [
  "Mokoena",
  "Molefe",
  "Motloung",
  "Mahlangu",
  "Ndlovu",
  "Mthembu",
  "Dlamini",
  "Molefe",
  "Motaung",
  "Mokone",
  "Mabena",
  "Mahlangu",
];

const groundNames = [
  "Mamelodi Community Ground",
  "Soshanguve Sports Ground",
  "Atteridgeville Community Field",
  "Ga-Rankuwa Sports Centre",
  "Tembisa Stadium",
  "Mabopane Community Ground",
  "Orlando Community Field",
  "Pretoria West Sports Ground",
  "Eersterust Community Field",
  "Tshwane Youth Sports Ground",
];

function makeEmail(prefix: string, index: number) {
  return `${prefix}${index}@kasiball.local`;
}

function dateOnly(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log("Starting KasiBall development seed...");

  const passwordHash = await hash(PASSWORD, 10);

  // ---------------------------------------------------------
  // 1. ADMIN
  // ---------------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@kasiball.local",
    },
    update: {},
    create: {
      email: "admin@kasiball.local",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Admin ready: ${admin.email}`);

  // ---------------------------------------------------------
  // 2. SEASON
  // ---------------------------------------------------------

  const season = await prisma.season.upsert({
    where: {
      name: "2026 KasiBall Development Season",
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      name: "2026 KasiBall Development Season",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      status: "ACTIVE",
    },
  });

  console.log(`Season ready: ${season.name}`);

  // ---------------------------------------------------------
  // 3. AGE GROUPS
  // ---------------------------------------------------------

  const ageGroupRecords: Record<string, typeof season> = {};

  for (const ageGroup of ageGroups) {
    const existing = await prisma.ageGroup.findFirst({
      where: {
        seasonId: season.id,
        name: ageGroup.name,
      },
    });

    const record =
      existing ??
      (await prisma.ageGroup.create({
        data: {
          seasonId: season.id,
          name: ageGroup.name,
          minAge: ageGroup.minAge,
          maxAge: ageGroup.maxAge,
        },
      }));

    ageGroupRecords[ageGroup.name] = record as never;

    console.log(`Age group ready: ${ageGroup.name}`);
  }

  // ---------------------------------------------------------
  // 4. GROUNDS
  // ---------------------------------------------------------

  const grounds = [];

  for (let i = 0; i < groundNames.length; i++) {
    const ground = await prisma.ground.findFirst({
      where: {
        name: groundNames[i],
      },
    });

    const record =
      ground ??
      (await prisma.ground.create({
        data: {
          name: groundNames[i],
          location: "Tshwane",
          address: `${groundNames[i]}, Gauteng`,
          capacity: 500 + i * 100,
          isActive: true,
        },
      }));

    grounds.push(record);
  }

  console.log(`Grounds ready: ${grounds.length}`);

  // ---------------------------------------------------------
  // 5. REFEREES
  // ---------------------------------------------------------

  const referees = [];

  for (let i = 1; i <= 3; i++) {
    const email = makeEmail("referee", i);

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {},
      create: {
        email,
        passwordHash,
        role: "REFEREE",
        isActive: true,
      },
    });

    const existing = await prisma.referee.findUnique({
      where: {
        userId: user.id,
      },
    });

    const referee =
      existing ??
      (await prisma.referee.create({
        data: {
          userId: user.id,
          firstName: ["Mandla", "Sello", "Vusi"][i - 1],
          lastName: ["Mokoena", "Molefe", "Nkosi"][i - 1],
          phone: `079000000${i}`,
          licenseNumber: `KSB-REF-${String(i).padStart(3, "0")}`,
          isActive: true,
        },
      }));

    referees.push(referee);
  }

  console.log(`Referees ready: ${referees.length}`);

  // ---------------------------------------------------------
  // 6. MANAGERS + TEAMS + APPLICATIONS
  // ---------------------------------------------------------

  const teamsByAgeGroup: Record<string, any[]> = {};

  for (const ageGroup of ageGroups) {
    teamsByAgeGroup[ageGroup.name] = [];

    for (let i = 0; i < 6; i++) {
      const teamName = teamNames[ageGroup.name][i];

      const email = `${ageGroup.name.toLowerCase()}.manager${i + 1}@kasiball.local`;

      const user = await prisma.user.upsert({
        where: {
          email,
        },
        update: {},
        create: {
          email,
          passwordHash,
          role: "MANAGER",
          isActive: true,
        },
      });

      let manager = await prisma.manager.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!manager) {
        manager = await prisma.manager.create({
          data: {
            userId: user.id,
            firstName: firstNames[i],
            lastName: lastNames[i],
            phone: `07810000${String(i + 1).padStart(2, "0")}`,
            address: "Tshwane, Gauteng",
          },
        });
      }

      let team = await prisma.team.findFirst({
        where: {
          name: teamName,
          ageGroupId: ageGroupRecords[ageGroup.name].id,
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamName,
            shortName: teamName
              .replace(" ", "")
              .substring(0, 5)
              .toUpperCase(),
            managerId: manager.id,
            ageGroupId: ageGroupRecords[ageGroup.name].id,
            status: "APPROVED",
          },
        });
      }

      // Ensure an approved application exists.
      const application = await prisma.teamApplication.findFirst({
        where: {
          managerId: manager.id,
          ageGroupId: ageGroupRecords[ageGroup.name].id,
          teamName,
        },
      });

      if (!application) {
        await prisma.teamApplication.create({
          data: {
            managerId: manager.id,
            ageGroupId: ageGroupRecords[ageGroup.name].id,
            teamName,
            kitDescription: "Community development kit",
            notes: "KasiBall development seed data",
            status: "APPROVED",
            reviewNotes: "Development seed application approved.",
            submittedAt: new Date("2026-01-05"),
            reviewedAt: new Date("2026-01-06"),
            reviewedBy: admin.id,
            approvedTeamId: team.id,
          },
        });
      }

      teamsByAgeGroup[ageGroup.name].push(team);

      console.log(`Team ready: ${ageGroup.name} - ${teamName}`);
    }
  }

  // ---------------------------------------------------------
  // 7. PLAYERS + REGISTRATIONS
  // ---------------------------------------------------------

  const registrationsByTeam = new Map<string, any[]>();

  for (const ageGroup of ageGroups) {
    for (let teamIndex = 0; teamIndex < 6; teamIndex++) {
      const team = teamsByAgeGroup[ageGroup.name][teamIndex];
      const registrations = [];

      for (let playerIndex = 0; playerIndex < 15; playerIndex++) {
        const playerFirstName =
          firstNames[(teamIndex * 3 + playerIndex) % firstNames.length];

        const playerLastName =
          lastNames[(teamIndex + playerIndex) % lastNames.length];

        const dateOfBirth = new Date(
          ageGroup.name === "U13"
            ? `2013-${String((playerIndex % 9) + 1).padStart(2, "0")}-15`
            : ageGroup.name === "U15"
              ? `2011-${String((playerIndex % 9) + 1).padStart(2, "0")}-15`
              : `2009-${String((playerIndex % 9) + 1).padStart(2, "0")}-15`,
        );

        const existingPlayer = await prisma.player.findFirst({
          where: {
            firstName: playerFirstName,
            lastName: playerLastName,
            dateOfBirth,
          },
        });

        const player =
          existingPlayer ??
          (await prisma.player.create({
            data: {
              firstName: playerFirstName,
              lastName: playerLastName,
              dateOfBirth,
              photoUrl: `/images/players/default-player-${(playerIndex % 5) + 1}.jpg`,
            },
          }));

        const existingRegistration =
          await prisma.playerRegistration.findUnique({
            where: {
              playerId_teamId_seasonId: {
                playerId: player.id,
                teamId: team.id,
                seasonId: season.id,
              },
            },
          });

        const registration =
          existingRegistration ??
          (await prisma.playerRegistration.create({
            data: {
              playerId: player.id,
              teamId: team.id,
              seasonId: season.id,
              shirtNumber: playerIndex + 1,
              registrationStatus:
                playerIndex === 14 ? "PENDING" : "VERIFIED",
              verifiedBy: playerIndex === 14 ? null : admin.id,
              verifiedAt: playerIndex === 14 ? null : new Date("2026-01-10"),
            },
          }));

        registrations.push(registration);
      }

      registrationsByTeam.set(team.id, registrations);
    }
  }

  console.log("Players and registrations ready.");

  // ---------------------------------------------------------
  // 8. DOUBLE ROUND-ROBIN FIXTURES
  // ---------------------------------------------------------

  const fixtureRecords = [];

  let globalMatchNumber = 0;

  for (const ageGroup of ageGroups) {
    const teams = teamsByAgeGroup[ageGroup.name];

    /*
     * 6 teams:
     *
     * Round 1:
     * 1 v 2
     * 3 v 4
     * 5 v 6
     *
     * ...etc
     *
     * We use a simple pair-generation algorithm instead of
     * relying on round-robin ordering.
     */

    const pairs: Array<{
      homeTeamId: string;
      awayTeamId: string;
      roundNumber: number;
    }> = [];

    let roundNumber = 1;

    // First half of season.
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        pairs.push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          roundNumber,
        });

        roundNumber++;

        if (roundNumber > 15) {
          roundNumber = 1;
        }
      }
    }

    // Second half reverses home/away.
    const firstHalf = [...pairs];

    for (const pair of firstHalf) {
      pairs.push({
        homeTeamId: pair.awayTeamId,
        awayTeamId: pair.homeTeamId,
        roundNumber: pair.roundNumber + 15,
      });
    }

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];

      const scheduled_date = dateOnly(
        addDays(new Date("2026-02-07"), globalMatchNumber * 7),
      );

      /*
       * Keep the seed schedule compact by cycling grounds,
       * referees and kickoff times.
       */
      const kickoffHours = [8, 10, 12];

      const kickoffHour = kickoffHours[globalMatchNumber % 3];

      const existing = await prisma.fixture.findFirst({
        where: {
          seasonId: season.id,
          ageGroupId: ageGroupRecords[ageGroup.name].id,
          homeTeamId: pair.homeTeamId,
          awayTeamId: pair.awayTeamId,
          roundNumber: pair.roundNumber,
        },
      });

      const fixture =
  existing ??
  (await prisma.fixture.create({
    data: {
      seasonId: season.id,
      ageGroupId: ageGroupRecords[ageGroup.name].id,
      homeTeamId: pair.homeTeamId,
      awayTeamId: pair.awayTeamId,
      groundId: grounds[globalMatchNumber % grounds.length].id,
      refereeId: referees[globalMatchNumber % referees.length].id,
      roundNumber: pair.roundNumber,

      scheduled_date: scheduled_date,

      kickoff_time: new Date(
        `${scheduled_date.toISOString().slice(0, 10)}T${String(
          kickoffHour
        ).padStart(2, "0")}:00:00.000Z`
      ),

      status:
        globalMatchNumber < 12
          ? "COMPLETED"
          : "SCHEDULED",
    },
  }));

      fixtureRecords.push(fixture);

      globalMatchNumber++;
    }
  }

  console.log(`Fixtures ready: ${fixtureRecords.length}`);

  // ---------------------------------------------------------
  // 9. COMPLETED MATCHES
  // ---------------------------------------------------------

  const completedFixtures = fixtureRecords.slice(0, 12);

  for (let i = 0; i < completedFixtures.length; i++) {
    const fixture = completedFixtures[i];

    const existingMatch = await prisma.match.findUnique({
      where: {
        fixtureId: fixture.id,
      },
    });

    if (existingMatch) {
      continue;
    }

    const homeScore = i % 4 === 0 ? 2 : i % 4 === 1 ? 1 : 3;
    const awayScore = i % 3 === 0 ? 1 : i % 3 === 1 ? 1 : 0;

    const match = await prisma.match.create({
      data: {
        fixtureId: fixture.id,
        homeScore,
        awayScore,
        status: "COMPLETED",
        submittedBy: referees[i % referees.length].userId,
        submitted_at: new Date("2026-03-01"),
        notes: "Development seed match result.",
      },
    });

    const homeRegistrations =
      registrationsByTeam.get(fixture.homeTeamId) ?? [];

    const awayRegistrations =
      registrationsByTeam.get(fixture.awayTeamId) ?? [];

    // 11 starters + 4 substitutes for each team.
    for (const registrations of [homeRegistrations, awayRegistrations]) {
      for (let playerIndex = 0; playerIndex < 15; playerIndex++) {
        await prisma.matchdaySquad.create({
          data: {
            matchId: match.id,
            teamId:
              registrations === homeRegistrations
                ? fixture.homeTeamId
                : fixture.awayTeamId,
            playerRegistrationId: registrations[playerIndex].id,
            starting: playerIndex < 11,
            substitute: playerIndex >= 11,
            goalkeeper: playerIndex === 0,
            shirtNumber: playerIndex + 1,
          },
        });
      }
    }

    // Add a few realistic match events.
    if (homeScore > 0) {
      for (let goal = 0; goal < homeScore; goal++) {
        await prisma.matchEvent.create({
          data: {
            matchId: match.id,
            teamId: fixture.homeTeamId,
            playerRegistrationId:
              homeRegistrations[(goal + 1) % 10].id,
            eventType: "GOAL",
            minute: 15 + goal * 12,
            notes: "Development seed goal.",
          },
        });
      }
    }

    if (awayScore > 0) {
      for (let goal = 0; goal < awayScore; goal++) {
        await prisma.matchEvent.create({
          data: {
            matchId: match.id,
            teamId: fixture.awayTeamId,
            playerRegistrationId:
              awayRegistrations[(goal + 2) % 10].id,
            eventType: "GOAL",
            minute: 20 + goal * 15,
            notes: "Development seed goal.",
          },
        });
      }
    }

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        teamId: fixture.homeTeamId,
        playerRegistrationId: homeRegistrations[5].id,
        eventType: "YELLOW_CARD",
        minute: 55,
        notes: "Development seed yellow card.",
      },
    });
  }

  console.log(`Completed matches ready: ${completedFixtures.length}`);

  // ---------------------------------------------------------
  // 10. AUDIT LOG
  // ---------------------------------------------------------

  const existingAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: "SEED",
      entityId: season.id,
      action: "CREATE",
    },
  });

  if (!existingAudit) {
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CREATE",
        entityType: "SEED",
        entityId: season.id,
        newValues: {
          description: "Initial KasiBall development seed",
          season: season.name,
          ageGroups: ["U13", "U15", "U17"],
          teamsPerAgeGroup: 6,
        },
      },
    });
  }

  console.log("");
  console.log("======================================");
  console.log("KasiBall seed completed successfully.");
  console.log("======================================");
  console.log("");
  console.log("Development login:");
  console.log("Admin: admin@kasiball.local");
  console.log("Password: KasiBallDev123!");
  console.log("");
  console.log("Managers:");
  console.log("u13.manager1@kasiball.local");
  console.log("u15.manager1@kasiball.local");
  console.log("u17.manager1@kasiball.local");
  console.log("Password: KasiBallDev123!");
  console.log("");
  console.log("Referees:");
  console.log("referee1@kasiball.local");
  console.log("referee2@kasiball.local");
  console.log("referee3@kasiball.local");
  console.log("Password: KasiBallDev123!");
}

main()
  .catch((error) => {
    console.error("KasiBall seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });