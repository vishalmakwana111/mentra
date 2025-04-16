// ... existing code ...
              {/* Summary Field */}
              <div>
                <label htmlFor="userSummary" className="block text-sm font-medium text-gray-700">
                  Summary (for Linking)
                  <Tooltip content="Provide concise keywords (e.g., 'React hooks state') to help automatically link this note to similar ones.">
                    <FiInfo className="inline ml-1 h-4 w-4 text-gray-400" />
                  </Tooltip>
                </label>
                <textarea
                  id="userSummary"
                  {...register("userSummary", { maxLength: 80 })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Core keywords for linking... (max 80 chars)"
                />
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {watch("userSummary")?.length || 0}/80
                </p>
              </div>

              {/* Content Field */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="content"
                  {...register("content", { maxLength: 1000 })}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter note content..."
                />
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {watch("content")?.length || 0}/1000
                </p>
              </div>
// ... existing code ...
