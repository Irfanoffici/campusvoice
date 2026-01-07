require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleFeedback = [
    { category: 'facilities', message: "Library computers aren't having internet", priority: 'high', status: 'new' },
    { category: 'teaching', message: "Professor ABC's lectures are very engaging and helpful", priority: 'low', status: 'reviewed' },
    { category: 'safety', message: 'Broken lights near parking lot after 7 PM', priority: 'critical', status: 'new' },
    { category: 'administration', message: 'Exam result was good for me, thanks a lot!', priority: 'low', status: 'resolved' },
    { category: 'events', message: 'We need more technical workshops and hackathons', priority: 'medium', status: 'new' }
];

async function seed() {
    console.log('🌱 Seeding Supabase...');

    const { error } = await supabase
        .from('feedback')
        .insert(sampleFeedback);

    if (error) {
        console.error('❌ Error seeding:', error.message);
        console.log('HINT: Did you create the tables in Supabase first?');
    } else {
        console.log(`✅ Successfully inserted sample items.`);
    }
}

seed();
