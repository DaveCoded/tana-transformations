const fs = require('fs');

// Read file and parse as a JS object
const file = JSON.parse(fs.readFileSync('./datasets/TanaIntermediate.json'));

// For storing pairs of strings in the form: [["[[some_uid_in_brackets]]", "Name to replace it with"]]
const uidLinksToReplace = [];

const LIT_NOTE_ID = 'H0jELO_Sq';
const FLEETING_NOTE_ID = '_uppAQjZT';
const BRANCH_ID = '-3sRjtvss';

for (const node of file.nodes) {
    // "continue" = skip to next iteration of the loop
    if (!nodeIsEvergreen(node)) continue;

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

        if (child.name === withLink(BRANCH_ID)) {
            child.name = 'Branches';
            child.type = 'field';
            removeIdFromRefs(child, BRANCH_ID);

            const branchChildren = child.children;

            for (const branchChild of branchChildren) {
                // If the child's name is not a reference, leave it be
                if (!branchChild.name.startsWith('[[')) continue;

                // If it's a reference, it has a uid we want to replace in the tree later
                const uidToMatch = branchChild.name.replace('[[', '').replace(']]', '');

                // Find the node with that uid and get its name. This function populates the
                // uidLinksToReplace array.
                for (const node2 of file.nodes) {
                    recursiveFindNameByUid(node2.children, uidToMatch, branchChild.name);
                }
            }
        }
    }
}

console.log('Number of replacements:', uidLinksToReplace.length);

let fileString = JSON.stringify(file);

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

fs.writeFileSync('./outputs/refactored.json', fileString);

// ******************************************
// ************ util functions **************
// ******************************************

function nodeIsEvergreen(node) {
    return node.name?.startsWith('✱');
}

function removeAsterisk(str) {
    return str.replace('✱', '').trimLeft();
}

function hasEvergreensLink(node) {
    return node.children[0] && node.children[0].name?.startsWith('[[bfSDi8a9U]]');
}

function withLink(str) {
    return `[[${str}]]`;
}

function removeIdFromRefs(child, id) {
    const index = child.refs.indexOf(id);
    if (index > -1) {
        child.refs.splice(index, 1);
    }
}

/**
 * From the top level nodes, recurse down through all children to find one
 * whose uid matches the one referenced in the Branches. Add both to the
 * its name, along with the branch name, to the uidLinksToReplace array.
 */
function recursiveFindNameByUid(nodes, uidToMatch, branchLinkName) {
    if (!Array.isArray(nodes)) return;
    for (const child of nodes) {
        if (child.uid === uidToMatch) {
            const newName = child.name;
            uidLinksToReplace.push([branchLinkName, newName]);
        } else if (child.children && child.children.length > 0) {
            recursiveFindNameByUid(child.children, uidToMatch, branchLinkName);
        }
    }
}
