import chalk from "chalk";
import { logger } from "../utils/logger.js";
import { loadConfig, getActiveCatalogs } from "../core/config.js";
import { loadCatalog } from "../core/installer.js";
import { getUserConfigPath } from "../utils/paths.js";
import { compareWithCatalog, getDiffSummary } from "../core/diff.js";

export async function list() {
  const config = loadConfig();
  const activeCatalogs = getActiveCatalogs(config);

  console.log("");
  console.log(chalk.bold("Registered Catalogs"));
  console.log(chalk.dim("─".repeat(60)));

  const catalogEntries = Object.entries(config.catalogs);

  if (catalogEntries.length === 0) {
    console.log(chalk.yellow("No catalogs registered"));
    console.log("");
    logger.info("Add a catalog: npx @brequet/ai-setup add <catalog-path>");
    return;
  }

  // Get diff for update indicators
  const diff = compareWithCatalog(config, activeCatalogs);
  const summary = getDiffSummary(diff);

  // Sort by priority
  catalogEntries.sort(([, a], [, b]) => a.priority - b.priority);

  for (const [id, entry] of catalogEntries) {
    try {
      const catalog = loadCatalog(id, entry);
      const skillCount = Object.keys(catalog.skills || {}).length;
      const statusIcon = entry.active ? chalk.green("●") : chalk.gray("○");

      // Calculate updates for this catalog
      const catalogUpdates = diff.updated.filter(
        (s) => s.catalogId === id,
      ).length;
      const catalogNew = diff.new.filter((s) => s.catalogId === id).length;

      let updateInfo = "";
      if (catalogUpdates > 0 || catalogNew > 0) {
        const parts = [];
        if (catalogNew > 0) parts.push(`${catalogNew} new`);
        if (catalogUpdates > 0)
          parts.push(
            `${catalogUpdates} update${catalogUpdates === 1 ? "" : "s"}`,
          );
        updateInfo = chalk.blue(` • ${parts.join(", ")}`);
      }

      console.log("");
      console.log(
        `${statusIcon} ${chalk.bold(id)} ${chalk.dim(`(priority: ${entry.priority})`)}${updateInfo}`,
      );
      console.log(`  ${chalk.dim("Name:")}     ${catalog.name}`);
      console.log(`  ${chalk.dim("Version:")}  ${catalog.version}`);
      console.log(`  ${chalk.dim("Type:")}     ${entry.type}`);

      if (entry.type === "git") {
        console.log(`  ${chalk.dim("URL:")}      ${entry.url}`);
        console.log(`  ${chalk.dim("Branch:")}   ${entry.branch || "main"}`);
        if (entry.lastSynced) {
          const syncedDate = new Date(entry.lastSynced).toLocaleString();
          console.log(`  ${chalk.dim("Synced:")}   ${syncedDate}`);
        }
      } else {
        console.log(`  ${chalk.dim("Path:")}     ${entry.path}`);
      }

      console.log(`  ${chalk.dim("Skills:")}   ${skillCount} available`);
      console.log(
        `  ${chalk.dim("Status:")}   ${entry.active ? chalk.green("active") : chalk.gray("inactive")}`,
      );
    } catch (error) {
      console.log("");
      console.log(
        `${chalk.red("✖")} ${chalk.bold(id)} ${chalk.dim(`(priority: ${entry.priority})`)}`,
      );
      console.log(`  ${chalk.red("Error:")} ${(error as Error).message}`);
      console.log(`  ${chalk.dim("Path:")}  ${entry.path}`);
    }
  }

  console.log("");
  console.log(chalk.dim("─".repeat(60)));

  // Installed skills section
  console.log("");
  console.log(chalk.bold("Installed Skills"));
  console.log(chalk.dim("─".repeat(60)));

  const installedEntries = Object.entries(config.installed);

  if (installedEntries.length === 0) {
    console.log(chalk.yellow("No skills installed"));
    console.log("");
    logger.info("Install skills: npx @brequet/ai-setup skills");
  } else {
    // Group by catalog
    const byCatalog = new Map<
      string,
      Array<[string, (typeof config.installed)[string]]>
    >();

    for (const entry of installedEntries) {
      const catalogId = entry[1].catalog;
      if (!byCatalog.has(catalogId)) {
        byCatalog.set(catalogId, []);
      }
      byCatalog.get(catalogId)!.push(entry);
    }

    // Build maps for quick lookup
    const updatedSkills = new Set(diff.updated.map((s) => s.fullName));
    const removedSkills = new Set(
      diff.removed.map((s) => `${s.catalog}-${s.skillName}`),
    );

    // Display by catalog
    for (const [catalogId, skills] of byCatalog) {
      const catalogUpdateCount = skills.filter(([fullName]) =>
        updatedSkills.has(fullName),
      ).length;
      const catalogRemovedCount = skills.filter(([fullName]) =>
        removedSkills.has(fullName),
      ).length;

      let catalogStatus = "";
      if (catalogUpdateCount > 0 || catalogRemovedCount > 0) {
        const parts = [];
        if (catalogUpdateCount > 0)
          parts.push(
            chalk.blue(
              `${catalogUpdateCount} update${catalogUpdateCount === 1 ? "" : "s"}`,
            ),
          );
        if (catalogRemovedCount > 0)
          parts.push(chalk.yellow(`${catalogRemovedCount} removed`));
        catalogStatus = ` • ${parts.join(", ")}`;
      }

      console.log("");
      console.log(
        chalk.bold(`  ${catalogId}`) +
          chalk.dim(
            ` (${skills.length} skill${skills.length === 1 ? "" : "s"})`,
          ) +
          catalogStatus,
      );

      for (const [fullName, skillData] of skills) {
        const installedDate = new Date(
          skillData.installedAt,
        ).toLocaleDateString();

        let statusIcon = chalk.green("✓");
        let statusText = "";

        if (updatedSkills.has(fullName)) {
          statusIcon = chalk.blue("↻");
          statusText = chalk.blue(" (update available)");
        } else if (removedSkills.has(fullName)) {
          statusIcon = chalk.yellow("⚠");
          statusText = chalk.yellow(" (removed from catalog)");
        }

        console.log(`    ${statusIcon} ${skillData.skillName}${statusText}`);
        console.log(
          `      ${chalk.dim(`v${skillData.version} • ${installedDate}`)}`,
        );
      }
    }

    console.log("");
    console.log(chalk.dim("─".repeat(60)));
    console.log(
      `Total: ${installedEntries.length} skill${installedEntries.length === 1 ? "" : "s"} installed`,
    );

    if (summary.hasChanges) {
      console.log("");
      const changeParts = [];
      if (summary.updatedCount > 0)
        changeParts.push(
          chalk.blue(
            `${summary.updatedCount} update${summary.updatedCount === 1 ? "" : "s"}`,
          ),
        );
      if (summary.newCount > 0)
        changeParts.push(chalk.green(`${summary.newCount} new`));
      if (summary.removedCount > 0)
        changeParts.push(chalk.yellow(`${summary.removedCount} removed`));

      console.log(chalk.dim("Changes available: ") + changeParts.join(", "));
    }
  }

  // Show available (not installed) skills
  if (diff.new.length > 0) {
    console.log("");
    console.log(chalk.bold("Available (not installed)"));
    console.log(chalk.dim("─".repeat(60)));
    console.log("");

    // Group by catalog
    const newByCatalog = new Map<string, typeof diff.new>();
    for (const skill of diff.new) {
      if (!newByCatalog.has(skill.catalogId)) {
        newByCatalog.set(skill.catalogId, []);
      }
      newByCatalog.get(skill.catalogId)!.push(skill);
    }

    for (const [catalogId, skills] of newByCatalog) {
      console.log(chalk.bold(`  ${catalogId}`));
      for (const skill of skills) {
        console.log(
          `    ${chalk.dim("○")} ${skill.skillName} ${chalk.dim("- " + skill.skill.description)}`,
        );
      }
      console.log("");
    }
  }

  if (summary.hasChanges) {
    console.log(
      chalk.dim("💡 Run ") +
        chalk.bold("skills") +
        chalk.dim(" to install updates"),
    );
  }

  console.log("");
  console.log(chalk.dim(`Config: ${getUserConfigPath()}`));
  console.log("");
}
