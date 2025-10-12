const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Create Supabase client
const supabase = createClient(
  'http://127.0.0.1:64321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function testUpload() {
  try {
    console.log('Creating test file...')
    // Create a simple test file
    const testContent = 'Hello from Supabase Storage test!'
    const fileName = `test-${Date.now()}.txt`
    
    console.log(`Uploading file: ${fileName}`)
    
    // Upload to the 'uploads' bucket
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      process.exit(1)
    }

    console.log('✅ Upload successful!')
    console.log('File path:', data.path)
    console.log('Full path:', data.fullPath)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)
    
    console.log('Public URL:', urlData.publicUrl)
    
    // List files to verify
    const { data: files, error: listError } = await supabase.storage
      .from('uploads')
      .list()
    
    if (listError) {
      console.error('List error:', listError)
    } else {
      console.log('\nFiles in bucket:')
      files.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size || 0} bytes)`)
      })
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

testUpload()
