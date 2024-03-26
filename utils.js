const {createClient} = require("@supabase/supabase-js")

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://agvjpbiqsftkaeitptgb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndmpwYmlxc2Z0a2FlaXRwdGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzkxNTE3NjYsImV4cCI6MTk5NDcyNzc2Nn0.7noebc4XYQ1C7y9XhMBxVc17luvB2CsjsMTNHdT0MOU"
);

module.exports = { supabase };

