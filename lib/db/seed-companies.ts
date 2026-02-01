import { db } from './index';
import { companies } from './schema/companies';

const seedData = [
  {
    companyName: "xAI",
    industry: "Artificial Intelligence",
    size: "201-500",
    priority: "Low",
    reportStatus: "none",
    website: "https://x.ai",
    description: "World's best AI research lab",
  },
  {
    companyName: "Stripe",
    industry: "Financial Technology",
    size: "5001-10000",
    priority: "Low",
    reportStatus: "none",
    website: "https://stripe.com",
    description: "Online payment processing platform",
  },
  {
    companyName: "Vercel",
    industry: "Cloud Computing",
    size: "201-500",
    priority: "Low",
    reportStatus: "none",
    website: "https://vercel.com",
    description: "Frontend cloud platform",
  },
  {
    companyName: "Databricks",
    industry: "Data & Analytics",
    size: "5001-10000",
    priority: "Low",
    reportStatus: "none",
    website: "https://databricks.com",
    description: "Data lakehouse platform",
  },
  {
    companyName: "Notion",
    industry: "Productivity Software",
    size: "201-500",
    priority: "Low",
    reportStatus: "none",
    website: "https://notion.so",
    description: "Collaborative workspace",
  },
  {
    companyName: "Figma",
    industry: "Design Tools",
    size: "501-1000",
    priority: "Low",
    reportStatus: "none",
    website: "https://figma.com",
    description: "Collaborative design platform",
  },
  {
    companyName: "Linear",
    industry: "Project Management",
    size: "51-200",
    priority: "Low",
    reportStatus: "none",
    website: "https://linear.app",
    description: "Issue tracking and project management",
  },
  {
    companyName: "Supabase",
    industry: "Database & Backend",
    size: "51-200",
    priority: "Low",
    reportStatus: "none",
    website: "https://supabase.com",
    description: "Open source Firebase alternative",
  },
  {
    companyName: "Replicate",
    industry: "Machine Learning",
    size: "11-50",
    priority: "Low",
    reportStatus: "none",
    website: "https://replicate.com",
    description: "Run ML models in the cloud",
  },
  {
    companyName: "Hugging Face",
    industry: "Machine Learning",
    size: "201-500",
    priority: "Low",
    reportStatus: "none",
    website: "https://huggingface.co",
    description: "ML model hub and collaboration platform",
  },
  {
    companyName: "Macy's",
    industry: "Retail",
    size: "5001-10000",
    priority: "Low",
    reportStatus: "none",
    website: "https://macysinc.com/",
    description: "Retail company",
  },
  {
    companyName: "Apple",
    industry: "Technology",
    size: "1001-5000",
    priority: "Low",
    reportStatus: "none",
    website: "https://apple.com",
    description: "Technology company",
  },
];

async function seed(force = false) {
  console.log('🌱 Seeding companies...');

  try {
    // Check if companies already exist
    const existing = await db.select().from(companies).limit(1);

    if (existing.length > 0 && !force) {
      console.log('⚠️  Companies already exist. Skipping seed.');
      console.log('   Run `npm run db:seed:force` to force re-seed.');
      return;
    }

    if (force && existing.length > 0) {
      console.log('🗑️  Clearing existing companies...');
      await db.delete(companies);
    }

    // Insert seed data
    await db.insert(companies).values(seedData);

    console.log(`✅ Successfully seeded ${seedData.length} companies!`);
  } catch (error) {
    console.error('❌ Failed to seed companies:');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  seed(force)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seed };
