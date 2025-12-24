"use client";

import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { FareRuleResponse } from "@/types/tbo";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

interface FareRulesViewProps {
	fareRules: FareRuleResponse | null;
}

export default function FareRulesView({ fareRules }: FareRulesViewProps) {
	const miniFareRules =
		fareRules?.Response?.Results?.MiniFareRules ||
		fareRules?.Response?.MiniFareRules;
	const fareRulesArray =
		fareRules?.Response?.Results?.FareRules || fareRules?.Response?.FareRules;

	return (
		<Card className="shadow-sm border-orange-200">
			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="rules" className="border-b-0">
					<CardHeader className="pb-0 pt-4 px-6">
						<AccordionTrigger className="hover:no-underline py-2">
							<CardTitle className="text-xl font-semibold flex items-center gap-2 text-left">
								<ScrollText className="h-5 w-5 text-orange-600" />
								<span>Fare Rules</span>
								<span className="text-sm font-normal text-muted-foreground ml-2">
									(Click to view details)
								</span>
							</CardTitle>
						</AccordionTrigger>
					</CardHeader>
					<AccordionContent className="pt-2 px-6 pb-6">
						{(() => {
							if (miniFareRules && miniFareRules.length > 0) {
								return (
									<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
										{miniFareRules.map((ruleGroup, groupIndex) => (
											<div
												key={groupIndex}
												className="bg-orange-50/50 p-4 rounded-lg border border-orange-100"
											>
												<div className="font-medium mb-3 text-orange-900">
													Fare Rules for {ruleGroup[0]?.JourneyPoints || "Route"}
												</div>
												<div className="space-y-3">
													{ruleGroup.map((rule, ruleIndex) => (
														<div
															key={ruleIndex}
															className="bg-white p-3 rounded border border-orange-200"
														>
															<div className="flex items-center justify-between mb-2">
																<div className="flex items-center gap-2">
																	<Badge
																		variant="outline"
																		className={`${
																			rule.Type === "Cancellation"
																				? "bg-red-50 text-red-700 border-red-200"
																				: rule.Type === "Reissue"
																				? "bg-blue-50 text-blue-700 border-blue-200"
																				: "bg-gray-50 text-gray-700 border-gray-200"
																		}`}
																	>
																		{rule.Type}
																	</Badge>
																	{rule.OnlineReissueAllowed && (
																		<Badge
																			variant="outline"
																			className="bg-green-50 text-green-700 border-green-200"
																		>
																			Online Allowed
																		</Badge>
																	)}
																</div>
																<div className="text-sm text-gray-600">
																	{rule.From}-{rule.To} {rule.Unit}
																</div>
															</div>
															<div className="text-sm font-medium text-gray-900">
																{rule.Details}
															</div>
														</div>
													))}
												</div>
											</div>
										))}
									</div>
								);
							} else if (fareRulesArray && fareRulesArray.length > 0) {
								return (
									<div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
										{fareRulesArray.map((rule, index) => (
											<div
												key={index}
												className="bg-orange-50/50 p-4 rounded-lg border border-orange-100"
											>
												<div className="font-medium mb-2 text-orange-900">
													<div className="flex items-center gap-2">
														<span className="text-sm">Airline:</span>
														<span className="text-sm text-gray-700">
															{rule.Airline}
														</span>
													</div>
													<div className="flex items-center gap-2 mt-1">
														<span className="text-sm">Fare Basis Code:</span>
														<span className="text-sm text-gray-700">
															{rule.FareBasisCode}
														</span>
													</div>
													<div className="flex items-center gap-2 mt-1">
														<Badge
															variant="outline"
															className="bg-white text-orange-700 border-orange-200"
														>
															{rule.Origin} {"->"} {rule.Destination}
														</Badge>
													</div>
												</div>
												{rule.FareRuleDetail ? (
													<div
														className="text-sm text-gray-700 fare-rules-content"
														dangerouslySetInnerHTML={{
															__html: rule.FareRuleDetail,
														}}
													/>
												) : (
													<div className="text-sm text-gray-500 italic">
														Detailed fare rules not available for this fare basis.
													</div>
												)}
											</div>
										))}
									</div>
								);
							} else if (fareRules === null) {
								return (
									<div className="text-center py-4 text-gray-500">
										<p>Unable to load fare rules. Please try refreshing.</p>
									</div>
								);
							} else {
								return (
									<div className="text-center py-4 text-gray-500">
										<p>No fare rules available for this flight.</p>
									</div>
								);
							}
						})()}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Card>
	);
}
