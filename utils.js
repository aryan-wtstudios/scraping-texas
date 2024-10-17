const {createClient} = require("@supabase/supabase-js")

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://wftdrtrfnnbhaettjmkd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdGRydHJmbm5iaGFldHRqbWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYwODYzNzMsImV4cCI6MjA0MTY2MjM3M30.gwP3xzoOxLmK2t7AgHFcKQ2oNQXuBXM1CurfUwrdhE8"
);

module.exports = { supabase };

