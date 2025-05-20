import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { execSync } from "child_process"; // Added to execute shell commands

// Load template
const templateSourceMain = fs.readFileSync(path.join(__dirname, "templates", "template.main.nr"), "utf-8");
const templateMain = Handlebars.compile(templateSourceMain);

const templateSourceNargo = fs.readFileSync(path.join(__dirname, "templates", "template.Nargo.toml"), "utf-8");
const templateNargo = Handlebars.compile(templateSourceNargo);

const MAX_DEPTH = 20;
const TRIE_LENGTH = 532;

// Generate code files for depths 1 to 20
// Realistically, it's unlikely that we'll need more than 20 though the formal limit is 64
for (let depth = 1; depth <= MAX_DEPTH; depth++) {
  const proofLength = depth * TRIE_LENGTH;

  const outputMain = templateMain({ depth, proof_length: proofLength });
  const outputNargo = templateNargo({ depth, proof_length: proofLength });

  const outputPathMain = path.join(__dirname, "src", `main.nr`);
  const outputPathNargo = path.join(__dirname, `Nargo.toml`);

  // Write the files
  fs.writeFileSync(outputPathMain, outputMain);
  fs.writeFileSync(outputPathNargo, outputNargo);

  console.log(`Generated: ${outputPathMain}`);
  console.log(`Generated: ${outputPathNargo}`);
  
  try {
    // Compile the code
    console.log(`Compiling for depth ${depth}...`);
    execSync("nargo compile", { stdio: 'inherit' });
    console.log(`Successfully compiled for depth ${depth}`);
  } catch (error) {
    console.error(`Compilation failed for depth ${depth}:`, error);
  } finally {
    // Clean up files after compilation
    console.log(`Cleaning up files for depth ${depth}...`);
    if (fs.existsSync(outputPathMain)) {
      fs.unlinkSync(outputPathMain);
      console.log(`Deleted: ${outputPathMain}`);
    }
    if (fs.existsSync(outputPathNargo)) {
      fs.unlinkSync(outputPathNargo);
      console.log(`Deleted: ${outputPathNargo}`);
    }
  }
  
  console.log(`Completed processing for depth ${depth}\n`);
}