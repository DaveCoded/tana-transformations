const fs = require('fs');

const nodeIsEvergreen = node => node.name?.startsWith('✱');
const removeAsterisk = str => str.replace('✱', '').trimLeft();
const hasEvergreensLink = node =>
    node.children[0] && node.children[0].name?.startsWith('[[bfSDi8a9U]]');

// Read file and parse as a JS object
let file = JSON.parse(fs.readFileSync('./datasets/TanaIntermediate.json'));

/**
 * uidLinksToReplace is an array of pairs in the form [["A", "B"], ["A", "B"]],
 * where "A" is a link/reference found in a "Branches" node — a uid in brackets: [[oij_lijSDFJI]],
 * and "B" is the name of the node that has the same uid (unlinked/no square brackets)
 */
const uidLinksToReplace = [];

const LIT_NOTE_ID = 'H0jELO_Sq';
const FLEETING_NOTE_ID = '_uppAQjZT';
const BRANCH_ID = '-3sRjtvss';

const withLink = str => `[[${str}]]`;

const removeIdFromRefs = (child, id) => {
    const index = child.refs.indexOf(id);
    if (index > -1) {
        child.refs.splice(index, 1);
    }
};

const recursiveFindNameByUid = (nodes, branchLinkName) => {
    if (!Array.isArray(nodes)) return;
    for (const child of nodes) {
        if (child.uid === uidToMatch) {
            const newName = child.name;
            uidLinksToReplace.push([branchLinkName, newName]);
        } else if (child.children && child.children.length > 0) {
            recursiveFindNameByUid(child.children);
        }
    }
};

for (const node of file.nodes) {
    // If this node is not an evergreen, skip it. "Continue" actually means:
    // "continue directly to the next loop iteration"
    if (!nodeIsEvergreen(node)) continue;

    // Set the node's supertags property and remove the large asterisk from the name
    node.supertags = ['Evergreens'];
    node.name = removeAsterisk(node.name);

    if (!hasEvergreensLink(node)) continue;

    for (const child of node.children[0].children) {
        if (child.name === withLink(LIT_NOTE_ID)) {
            child.name = '<b>Literature notes</b>';
            removeIdFromRefs(child, LIT_NOTE_ID);
        }

        if (child.name === withLink(FLEETING_NOTE_ID)) {
            child.name = '<b>Fleeting notes</b>';
            removeIdFromRefs(child, FLEETING_NOTE_ID);
        }

        // reformat branches
        if (child.name === withLink(BRANCH_ID)) {
            child.name = 'Branches';
            // ? This was commented out. Do we need to not do this for some reason?
            child.type = 'field';
            removeIdFromRefs(child, BRANCH_ID);

            const branchChildren = child.children;

            for (const branchChild of branchChildren) {
                if (!branchChild.name.startsWith('[[')) continue;

                // For each child of a "Branches" node, find the links — those that have
                // [[double brackets]] — and get the text between the brackets. This is a uid.
                const uidToMatch = branchChild.name.replace('[[', '').replace(']]', '');

                // From the top level nodes, recurse down through all child nodes to find one
                // whose uid matches the one referenced in the Branches. Take its name. We will
                // replace every linked uid — the branch child's original name that looks something
                // like "[[oij_lijSDFJI]]" — in the file with the new name.
                for (const node2 of file.nodes) {
                    recursiveFindNameByUid(node2.children, branchChild.name);
                }
            }
        }
    }
}

const fileString = JSON.stringify(file);
/**
 * Replace uid links with the names of the nodes that match that uid.
 * e.g. "[[oij_lijSDFJI]]" -> "How to bin friends and influence sheeple"
 * This is done by turning the whole tree into a string and using a simple
 * find and replace on that string.
 */
uidLinksToReplace.forEach(arr => {
    console.log(`Replacing ${arr[0]} for ${arr[1]}`);
    fileString = fileString.replace(arr[0], arr[1]);
});

// * This is the old way I was doing it that was much slower. I've kept it in
// * case the new "improved" way doesn't actually work...
// uidLinksToReplace.forEach(arr => {
//     console.log(`Replacing ${arr[0]} for ${arr[1]}`);
//     file = JSON.parse(JSON.stringify(file).replace(arr[0], arr[1]));
// });

fs.writeFileSync('./outputs/crazyReplaceNoField.json', fileString);
