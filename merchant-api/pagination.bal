// Builds the "next"/"previous" relative-URI pair every collection GET's
// envelope carries (openapi-conventions pagination convention).
//
// + basePath - the collection's own path, e.g. "/me/transactions"
// + extraQuery - any additional query string to repeat on every page link,
//   already prefixed with "&" (e.g. "&status=pending"), or "" for none
// + pageLimit - the page size requested
// + offset - the offset requested
// + count - total matching rows
// + return - [next, previous], each () when there is no such page
function pageLinks(string basePath, string extraQuery, int pageLimit, int offset, int count)
        returns [string?, string?] {
    string? next = ();
    string? previous = ();
    if offset + pageLimit < count {
        int nextOffset = offset + pageLimit;
        next = string `${basePath}?limit=${pageLimit}&offset=${nextOffset}${extraQuery}`;
    }
    if offset > 0 {
        int previousOffset = offset - pageLimit;
        if previousOffset < 0 {
            previousOffset = 0;
        }
        previous = string `${basePath}?limit=${pageLimit}&offset=${previousOffset}${extraQuery}`;
    }
    return [next, previous];
}
