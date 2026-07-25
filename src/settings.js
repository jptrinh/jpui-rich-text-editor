// Reusable style-property blocks for the rich text editor.
// Each content element type (paragraph, headings, quote, code, lists, link)
// reuses the same typography controls, generated with a shared prefix so the
// whole group can be dropped into ww-config `properties` and grouped in the
// side panel via `customStylePropertiesOrder`.

const lengthPx = (min = 0, max = 200) => ({
    type: 'Length',
    options: {
        unitChoices: [
            { value: 'px', label: 'px', min, max },
            { value: 'em', label: 'em', min: 0, max: 10 },
            { value: 'rem', label: 'rem', min: 0, max: 10 },
        ],
        noRange: true,
        useVar: true,
    },
    bindable: true,
    responsive: true,
});

// One typography group for a given element type.
// `prefix` is used both for the property keys (e.g. `h1FontSize`) and the CSS
// variables produced in wwElement.vue (e.g. `--rt-h1-font-size`). Labels are just
// the field name — the group header (customStylePropertiesOrder) already names
// the element type, so repeating it in every row only clutters the panel.
// `labelEn` names the element type in the editor-only tooltips, where there is no
// surrounding group header to give the property context.
export function typographyGroup(prefix, labelEn) {
    return {
        [`${prefix}FontFamily`]: {
            label: { en: 'Font', fr: 'Police' },
            type: 'FontFamily',
            section: 'style',
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'font-family',
                type: 'string',
                tooltip: `Font family for ${labelEn}, e.g. \`"Inter, sans-serif"\`.`,
            },
            propertyHelp: { tooltip: `Font family applied to ${labelEn} content.` },
            /* wwEditor:end */
        },
        [`${prefix}FontSize`]: {
            label: { en: 'Size', fr: 'Taille' },
            section: 'style',
            ...lengthPx(1, 120),
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'font-size',
                type: 'string',
                tooltip: `Font size for ${labelEn}, with a unit: \`"24px"\` | \`"1.5rem"\` | \`"1.2em"\`.`,
            },
            propertyHelp: { tooltip: `Font size applied to ${labelEn} content.` },
            /* wwEditor:end */
        },
        [`${prefix}FontWeight`]: {
            label: { en: 'Weight', fr: 'Graisse' },
            type: 'TextSelect',
            section: 'style',
            options: {
                options: [
                    { value: null, label: { en: 'Default', fr: 'Par défaut' } },
                    { value: '300', label: { en: '300 - Light' } },
                    { value: '400', label: { en: '400 - Normal' } },
                    { value: '500', label: { en: '500 - Medium' } },
                    { value: '600', label: { en: '600 - Semi Bold' } },
                    { value: '700', label: { en: '700 - Bold' } },
                    { value: '800', label: { en: '800 - Extra Bold' } },
                ],
            },
            defaultValue: null,
            bindable: true,
            responsive: true,
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'font-weight',
                type: 'string',
                tooltip: `Font weight for ${labelEn}. Valid values: \`"300"\` | \`"400"\` | \`"500"\` | \`"600"\` | \`"700"\` | \`"800"\`, or \`null\` to inherit.`,
            },
            propertyHelp: { tooltip: `Font weight applied to ${labelEn} content.` },
            /* wwEditor:end */
        },
        [`${prefix}Color`]: {
            label: { en: 'Color', fr: 'Couleur' },
            type: 'Color',
            section: 'style',
            bindable: true,
            responsive: true,
            options: { nullable: true },
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'color',
                type: 'string',
                tooltip: `Text color for ${labelEn}, e.g. \`"#1f2937"\` or \`"rgba(0,0,0,0.8)"\`.`,
            },
            propertyHelp: { tooltip: `Text color applied to ${labelEn} content.` },
            /* wwEditor:end */
        },
        [`${prefix}LineHeight`]: {
            label: { en: 'Line height', fr: 'Interligne' },
            section: 'style',
            ...lengthPx(0, 10),
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'line-height',
                type: 'string',
                tooltip: `Line height for ${labelEn}, with a unit: \`"24px"\` | \`"1.5em"\`.`,
            },
            propertyHelp: { tooltip: `Line height applied to ${labelEn} content.` },
            /* wwEditor:end */
        },
        [`${prefix}MarginTop`]: {
            label: { en: 'Margin top', fr: 'Marge haut' },
            section: 'style',
            ...lengthPx(0, 120),
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'margin-top',
                type: 'string',
                tooltip: `Space above ${labelEn}, with a unit: \`"16px"\` | \`"1rem"\`.`,
            },
            propertyHelp: { tooltip: `Space above each ${labelEn} block.` },
            /* wwEditor:end */
        },
        [`${prefix}MarginBottom`]: {
            label: { en: 'Margin bottom', fr: 'Marge bas' },
            section: 'style',
            ...lengthPx(0, 120),
            /* wwEditor:start */
            bindingValidation: {
                cssSupports: 'margin-bottom',
                type: 'string',
                tooltip: `Space below ${labelEn}, with a unit: \`"16px"\` | \`"1rem"\`.`,
            },
            propertyHelp: { tooltip: `Space below each ${labelEn} block.` },
            /* wwEditor:end */
        },
    };
}

// The element types we expose grouped styling for, in display order.
// `prefix` drives the property keys and the CSS variable names; the matching CSS
// selectors live in wwElement.vue's stylesheet, which is compiled separately and
// cannot read this array — so deliberately don't mirror them here.
export const CONTENT_TYPES = [
    { prefix: 'paragraph', label: 'Paragraph' },
    { prefix: 'h1', label: 'Heading 1' },
    { prefix: 'h2', label: 'Heading 2' },
    { prefix: 'h3', label: 'Heading 3' },
    { prefix: 'h4', label: 'Heading 4' },
    { prefix: 'h5', label: 'Heading 5' },
    { prefix: 'h6', label: 'Heading 6' },
    { prefix: 'blockquote', label: 'Quote' },
    // `extras` are extra property keys appended to this type's side-panel group.
    { prefix: 'code', label: 'Code', extras: ['codeBackground'] },
    { prefix: 'list', label: 'Lists' },
    { prefix: 'link', label: 'Link', extras: ['linkTextDecoration'] },
];

// Typography sub-properties (suffixes) that each group defines, used to build
// CSS variables in wwElement.vue.
export const TYPO_FIELDS = [
    { suffix: 'FontFamily', css: 'font-family' },
    { suffix: 'FontSize', css: 'font-size' },
    { suffix: 'FontWeight', css: 'font-weight' },
    { suffix: 'Color', css: 'color' },
    { suffix: 'LineHeight', css: 'line-height' },
    { suffix: 'MarginTop', css: 'margin-top' },
    { suffix: 'MarginBottom', css: 'margin-bottom' },
];
