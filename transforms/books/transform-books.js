const uid = require('uid');

function transformBooks(file) {
    for (const node of file.nodes) {
        if (!nodeIsBook(node.name)) continue;

        node.supertags = ['Book'];
        node.name = renameBook(node.name);

        if (hasNoChildren(node)) continue;

        const categoriesNode = node.children.find(c => c.name === 'Categories');

        if (categoriesNode) {
            const relatedToNode = categoriesNode.children.find(c => c.name === 'Related to');

            if (relatedToNode) {
                if (hasNoChildren(relatedToNode)) continue;
                const nodesToDelete = [];

                for (const [index, child] of relatedToNode.children.entries()) {
                    const { name } = child;

                    if (index === 0) {
                        const newNodes = createNodesFromReferenceList(name);
                        if (newNodes) {
                            relatedToNode.children.push(...newNodes);
                            nodesToDelete.push(index);
                        }
                    } else if (['Author', 'Year'].includes(name)) {
                        node.children.push(child);
                    } else if (name === 'Link') {
                        processLink(file, node, child);
                    } else if (name === 'Source') {
                        child.name = 'Link';
                        // ! Assuming that after renaming source as a Link, we want to do the same as we did for links, making it a url?
                        processLink(file, node, child);
                    } else {
                        nodesToDelete.push(index);
                    }
                }

                if (nodesToDelete.length) {
                    nodesToDelete.forEach(index => {
                        // Delete the node at each index of relatedToNode.children
                        // ! But the location of the actual nodes will change as you mutate the array. So look it up first!
                    });
                }

                // You'll have to delete all the nodes you've copied to the top level. They're supposed to "move".

                // Copy relatedToNode to the node.children array
                // Delete the "Categories" node
            }
        }
    }

    return file;
}

function nodeIsBook(name) {
    const regex = new RegExp('Book/', 'gi');
    return regex.test(name);
}

function renameBook(original) {
    return original.replace('Book/', '').trimLeft();
}

function hasNoChildren(node) {
    if (!node.children || node.children.length < 1) return true;
    else return false;
}

function createNodesFromReferenceList(str) {
    // get all the double bracketed things from the str
    const ids = bracketsExtractor(str);
    // if there are more than one, create a node from each
    if (!ids || !ids.length || ids.length < 2) return;

    return ids.map(id => ({
        uid: uid(9), // ? Or leave this as empty string
        name: `[[${id}]]`,
        type: 'node',
        refs: [id],
        createdAt: '', // ? Or get these from the reference list's node
        editedAt: ''
    }));
}

function bracketsExtractor(str) {
    const matcher = /\[\[(.*?)\]\]/gs;
    return str.match(matcher);
}

function processLink(file, node, child) {
    node.children.push(child);
    const linkAttribute = file.attributes.find(attr => attr.name === 'Link');
    if (linkAttribute) {
        linkAttribute.values.push(child.uid);
        linkAttribute.count++;
    } else {
        file.attributes.push({
            name: 'Link',
            values: [child.uid],
            count: 1,
            dataType: 'url'
        });
    }
}

module.exports = { transformBooks, renameBook, nodeIsBook };
