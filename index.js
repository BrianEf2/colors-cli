import inquirer from 'inquirer';
import fs from 'fs';
import { getColors } from 'theme-colors';
import JSON5 from 'json5';

const questions = [
    {
        type: 'input',
        name: 'colorName',
        message: 'Enter the name for the color:',
        validate: function(value) {
            return value.trim() !== '' ? true : 'Color name cannot be empty.';
        }
    },
    {
        type: 'input',
        name: 'colorHex',
        message: 'Enter the color in HEX format without #:',
        validate: function(value) {
            const isValid = /^([0-9A-F]{3}){1,2}$/i.test(value.trim());
            return isValid ? true : 'Please enter a valid HEX color.';
        }
    },
    {
        type: 'confirm',
        name: 'addAnother',
        message: 'Do you want to add another color?',
        default: false
    }
];

function hexToRgb(hex) {
    // Remove any leading '#' character
    hex = hex.replace(/^#/, '');

    // Extract individual color components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Return RGB string in the format "r g b"
    return `${r} ${g} ${b}`;
}

async function promptForColors() {
    const cssColors = {};
    const tailwindColors = {};
    let colorCount = 0;

    while (colorCount < 5) {
        const answers = await inquirer.prompt(questions);

        const colorName = answers.colorName.trim();
        const colorHex = answers.colorHex.trim();
        const shades = getColors(colorHex);
        const tailwindVariables = {};
        const cssVariables = {};

        // Create CSS/Tailwind variables for each shade
        Object.keys(shades).forEach(shadeKey => {
            const rgb = hexToRgb(shades[shadeKey]);
            const variableName = `--color-${colorName}-${shadeKey}`;
            tailwindVariables['DEFAULT'] = `rgb(var(--color-${colorName}-500) / <alpha-value>)`;
            tailwindVariables[shadeKey] = `rgb(var(${variableName}) / <alpha-value>)`;
            cssVariables[shadeKey] = `${variableName}: ${rgb};`;
        });

        cssColors[colorName] = cssVariables;
        tailwindColors[colorName] = tailwindVariables;

        colorCount += 1;

        if (!answers.addAnother) {
            break;
        }
    }

    // Write Tailwind output
    const tailwindOutput = {
        theme: {
            extend: {
                colors: tailwindColors
            }
        }
    };

    // Stringify and remove single quotes from the output
    const tailwindConfig = JSON5.stringify(tailwindOutput, null, 2).replace(/'(\d+)':/g, '$1:');

    // Write Tailwind configuration to file
    fs.writeFile('tailwind.config.js', `module.exports = ${tailwindConfig}`, (err) => {
        if (err) {
            console.error('Error saving Tailwind CSS configuration:', err);
        } else {
            console.log('Tailwind CSS configuration successfully saved to tailwind.config.js');
        }
    });

    // Write CSS output
    const output = Object.keys(cssColors).map(colorName => {
        const variables = cssColors[colorName];
        return Object.keys(variables).map(key => `${variables[key]}`).join('\n  ');
    }).join('\n\n  ');

    const cssOutput = `
:root {
  ${output}
}`;

    // Write CSS variables to file
    fs.writeFile('colors.css', cssOutput, (err) => {
        if (err) {
            console.error('Error saving the file:', err);
        } else {
            console.log('CSS variables successfully saved to colors.css');
        }
    });
}

promptForColors();
