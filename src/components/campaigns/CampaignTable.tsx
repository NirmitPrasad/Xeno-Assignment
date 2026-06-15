import React from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CHANNEL_COLOR, STATUS_COLOR } from "@/constants";

interface CampaignTableProps {
  campaigns: any[];
  showArchived: boolean;
  onEdit: (c: any) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => Promise<any>;
}

export function CampaignTable({
  campaigns,
  showArchived,
  onEdit,
  onDelete,
  onUpdateStatus,
}: CampaignTableProps) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Recipients</th>
              <th className="px-4 py-3 text-right">Open rate</th>
              <th className="px-4 py-3 text-right">Click rate</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns
              .filter((c: any) => showArchived || !c.status.startsWith("archived"))
              .map((c: any) => {
                const isArchived = c.status.startsWith("archived");
                const displayStatus = isArchived ? "archived" : c.status;

                return (
                  <tr key={c.id} className="border-t hover:bg-accent/40 text-foreground">
                    <td className="px-4 py-3">
                      <Link
                        to="/campaigns/$id"
                        params={{ id: c.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`shadow-none ${CHANNEL_COLOR[c.channel] || "bg-secondary"}`}
                      >
                        {c.channel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`shadow-none capitalize ${STATUS_COLOR[displayStatus] || "bg-gray-100 text-gray-800"}`}
                      >
                        {displayStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{c.total_recipients}</td>
                    <td className="px-4 py-3 text-right">{c.open_rate}%</td>
                    <td className="px-4 py-3 text-right">{c.click_rate}%</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(c.created_at), "dd MMM, HH:mm")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isArchived ? (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer text-amber-600 focus:text-amber-600"
                                onClick={() => {
                                  const originalStatus = c.status.split(":")[1] || "completed";
                                  onUpdateStatus(c.id, originalStatus);
                                }}
                              >
                                Unarchive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => onDelete(c.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              {["draft", "failed", "scheduled"].includes(displayStatus) && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => onEdit(c)}
                                >
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {["active", "completed"].includes(displayStatus) && (
                                <DropdownMenuItem asChild>
                                  <Link
                                    to="/campaigns/$id"
                                    params={{ id: c.id }}
                                    className="cursor-pointer w-full"
                                  >
                                    View
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {displayStatus === "scheduled" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                                  onClick={() => onUpdateStatus(c.id, "failed")}
                                >
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              {displayStatus === "active" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                                  onClick={() => onUpdateStatus(c.id, "paused")}
                                >
                                  Pause
                                </DropdownMenuItem>
                              )}
                              {displayStatus === "paused" && (
                                <>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-amber-600 focus:text-amber-600"
                                    onClick={() => onUpdateStatus(c.id, "active")}
                                  >
                                    Resume
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="cursor-pointer text-muted-foreground focus:text-muted-foreground"
                                    onClick={() => onUpdateStatus(c.id, `archived:${c.status}`)}
                                  >
                                    Archive
                                  </DropdownMenuItem>
                                </>
                              )}
                              {displayStatus === "completed" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-muted-foreground focus:text-muted-foreground"
                                  onClick={() => onUpdateStatus(c.id, `archived:${c.status}`)}
                                >
                                  Archive
                                </DropdownMenuItem>
                              )}
                              {displayStatus === "failed" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                                  onClick={() => onUpdateStatus(c.id, "active")}
                                >
                                  Retry
                                </DropdownMenuItem>
                              )}
                              {["draft", "failed"].includes(displayStatus) && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => onDelete(c.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No campaigns yet.{" "}
                  <Link to="/" className="text-primary underline">
                    Start in chat →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
